// ============================================================
// components/PenaltyModal.jsx — Modal de aplicação de penalidade (versão legada)
//
// ATENÇÃO: Este componente é uma versão mais antiga do fluxo de penalidades.
// A versão atual e mais completa é o PenaltyPanel.jsx (painel lateral
// com histórico de penalidades e gerenciamento completo).
// Este modal pode ainda estar referenciado em algum lugar do código
// ou mantido como alternativa mais simples.
//
// Exibe um modal (caixa de diálogo sobreposta) para aplicar uma
// penalidade a um usuário. O modal tem:
//   - Cabeçalho com nome e avatar do usuário
//   - Grade de botões para selecionar o tipo de penalidade (1 a 4)
//   - Dropdown para selecionar a duração
//   - Campo de texto para o motivo (obrigatório — botão desabilitado se vazio)
//   - Botões de Cancelar e Aplicar Penalidade
//
// Como funciona o overlay de fundo:
//   Um <div className={styles.overlay}> cobre a tela inteira com
//   fundo semitransparente escuro. Ao clicar nele, chama onClose,
//   fechando o modal.
//
// Props (parâmetros recebidos pelo componente):
//   isOpen   → boolean: se true, o modal é renderizado; se false, retorna null
//   user     → objeto do usuário a ser penalizado (campos: id, avatar, name, email)
//   onClose  → função chamada para fechar o modal
//   onSubmit → função assíncrona chamada ao confirmar a penalidade.
//              Recebe: { userId, tipo, duracao, motivo }
//
// Interligação:
//   - Pode ser importado por: Usuarios.jsx ou outros componentes
//   - Lucide React: X, ShieldAlert, Ban, UserX, Clock
//
// Estilo: PenaltyModal.module.css
//   Classes CSS utilizadas:
//     .overlay    → div semitransparente que cobre toda a tela
//     .modal      → caixa branca centralizada com o formulário
//     .header     → cabeçalho do modal: título + botão fechar (X)
//     .closeBtn   → botão X para fechar
//     .userInfo   → linha com avatar + nome/email do usuário
//     .avatar     → círculo com a letra inicial do nome
//     .userName   → nome do usuário
//     .userEmail  → email do usuário (texto menor)
//     .form       → formulário com os campos de penalidade
//     .formGroup  → agrupa label + campo
//     .label      → etiqueta do campo
//     .tiposGrid  → grade de botões de tipo de penalidade
//     .tipoOption → botão de seleção de tipo (não é submit, só seleciona)
//     .selected   → estilo do tipo de penalidade selecionado (destaque visual)
//     .select     → dropdown de duração
//     .textarea   → campo de texto para o motivo
//     .actions    → linha de botões de ação (Cancelar | Aplicar)
//     .btnCancel  → botão "Cancelar" (estilo secundário)
//     .btnSubmit  → botão "Aplicar Penalidade" (estilo primário/vermelho)
// ============================================================

import { useState } from "react";
import { X, ShieldAlert, Ban, UserX, Clock } from "lucide-react";
import styles from "./PenaltyModal.module.css";

// TIPO_LABELS: mapa de número → descrição do tipo de penalidade.
// As chaves são strings (não números) porque os dados de formulário em HTML
// sempre são strings; isso evita conversão com parseInt para a comparação.
const TIPO_LABELS = {
  1: "Impedimento de oferecer caronas",
  2: "Impedimento de solicitar caronas",
  3: "Impedimento de oferecer e solicitar caronas",
  4: "Suspensão de conta",
};

// TIPO_ICONS: mapa de número → componente de ícone do tipo correspondente.
const TIPO_ICONS = {
  1: ShieldAlert,
  2: ShieldAlert,
  3: Ban,
  4: UserX,
};

// DURACAO_OPTIONS: array de opções para o dropdown de duração.
// value → enviado para a API | label → exibido para o usuário
const DURACAO_OPTIONS = [
  { value: "1semana", label: "1 semana" },
  { value: "2semanas", label: "2 semanas" },
  { value: "1mes", label: "1 mês" },
  { value: "3meses", label: "3 meses" },
  { value: "6meses", label: "6 meses" },
];

export function PenaltyModal({ isOpen, user, onClose, onSubmit }) {
  // Estados dos campos do formulário
  const [tipoSelecionado, setTipoSelecionado] = useState("1"); // tipo selecionado (string)
  const [duracao, setDuracao] = useState("1semana");
  const [motivo, setMotivo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guarda de renderização: se o modal não está aberto ou não há usuário,
  // retorna null → nada é renderizado no DOM.
  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    // e.preventDefault() → evita que o formulário recarregue a página
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // onSubmit é uma função assíncrona recebida como prop,
      // await espera ela concluir antes de continuar
      await onSubmit({
        userId: user.id,
        tipo: tipoSelecionado,
        duracao,
        motivo,
      });

      // Reseta o formulário para os valores iniciais após o sucesso
      setTipoSelecionado("1");
      setDuracao("1semana");
      setMotivo("");
      onClose();
    } finally {
      // finally: sempre executa, mesmo em caso de erro na prop onSubmit
      setIsSubmitting(false);
    }
  };

  return (
    // Fragment (<>) → permite renderizar dois elementos (overlay + modal)
    // sem criar um div extra no DOM
    <>
      {/* Overlay: fundo escuro semitransparente. onClick → fecha o modal */}
      <div className={styles.overlay} onClick={onClose}></div>

      {/* Modal: caixa branca posicionada sobre o overlay */}
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Penalizar Usuário</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        {/* Informações do usuário sendo penalizado */}
        <div className={styles.userInfo}>
          <span className={styles.avatar}>{user.avatar}</span>
          <div>
            <p className={styles.userName}>{user.name}</p>
            <span className={styles.userEmail}>{user.email}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* ── Seleção do tipo de penalidade ── */}
          <div className={styles.formGroup}>
            <label htmlFor="tipo" className={styles.label}>
              Tipo de Penalidade
            </label>
            {/* Grade de botões: um para cada tipo.
                Object.entries() → converte o objeto em array de pares [chave, valor]
                Ex: [[1, "Impedimento..."], [2, "..."], ...] */}
            <div className={styles.tiposGrid}>
              {Object.entries(TIPO_LABELS).map(([id, label]) => {
                // TIPO_ICONS[id] → obtém o componente de ícone pelo ID
                const Icon = TIPO_ICONS[id];
                return (
                  <button
                    key={id}
                    type="button" // type="button" → NÃO submete o form ao clicar
                    onClick={() => setTipoSelecionado(id)}
                    // styles.selected é adicionado dinamicamente ao botão selecionado
                    className={`${styles.tipoOption} ${
                      tipoSelecionado === id ? styles.selected : ""
                    }`}
                  >
                    <Icon size={24} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Dropdown de duração ── */}
          <div className={styles.formGroup}>
            <label htmlFor="duracao" className={styles.label}>
              <Clock size={16} />
              Duração da Penalidade
            </label>
            <select
              id="duracao"
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
              className={styles.select}
            >
              {DURACAO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* ── Campo de motivo ── */}
          <div className={styles.formGroup}>
            <label htmlFor="motivo" className={styles.label}>
              Motivo da Penalidade
            </label>
            <textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo da penalidade..."
              className={styles.textarea}
              rows={4}
            />
          </div>

          {/* ── Botões de ação ── */}
          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnCancel}
            >
              Cancelar
            </button>
            {/* Botão desabilitado se: enviando OU motivo vazio.
                !motivo.trim() → trim() remove espaços; se a string
                resultante for vazia, a condição é true. */}
            <button
              type="submit"
              disabled={isSubmitting || !motivo.trim()}
              className={styles.btnSubmit}
            >
              {isSubmitting ? "Penalizando..." : "Aplicar Penalidade"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
