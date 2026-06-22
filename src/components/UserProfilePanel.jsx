// ============================================================
// components/UserProfilePanel.jsx — Painel lateral de perfil do usuário
//
// Painel deslizante que cobre a tela à direita para exibir os dados
// completos de um usuário em dois modos:
//   - Modo visualização ('view'): grade de cards com todas as informações
//   - Modo edição ('edit'):  formulário com campos editáveis (nome,
//     telefone, status); campos de e-mail, instituição e curso são
//     desabilitados pois pertencem ao usuário ou à instituição
//
// Diferente do PenaltyPanel, este componente NÃO tem overlay:
// ele aparece como um painel que empurra visualmente o conteúdo.
//
// Como funciona enrichUser:
//   Normaliza o objeto de usuário vindo da API (campos usu_*, esc_nome,
//   cur_nome, per_tipo) para o formato esperado pelo painel. Campos que a
//   API não retorna aparecem como '—'.
//
// Componente interno InfoCard:
//   Um "card de informação" simples com ícone, rótulo e valor.
//   Definido no mesmo arquivo porque é usado apenas aqui e é pequeno.
//
// Bibliotecas usadas:
//   - react         → useState
//   - lucide-react  → ArrowLeft, Edit2, Save, X, User, Mail, Phone,
//                     Building2, BookOpen, ShieldCheck,
//                     CheckCircle, AlertCircle, Loader2
//
// Dados consumidos:
//   - user (via prop) → dados do usuário vindos de Usuarios.jsx
//   - api.updateUser() → chamada para salvar edições
//
// Interligação:
//   - Importado por: Usuarios.jsx
//   - Usa: api.js
//   - Callbacks: onClose (fecha o painel), onUserUpdated (atualiza a lista)
//
// Props (parâmetros recebidos pelo componente):
//   user          → objeto do usuário com campos usu_*
//   initialMode   → 'view' ou 'edit' (default: 'view')
//   onClose       → função chamada para fechar o painel
//   onUserUpdated → função chamada após salvar uma edição,
//                   recebe o objeto atualizado para refletir na tabela
//
// Estilo: UserProfilePanel.module.css
//   Classes CSS utilizadas:
//     .panel           → div raiz do painel (posição fixed, altura total)
//     .panelHeader     → cabeçalho: botão voltar + botão editar/cancelar
//     .backBtn         → botão "← Voltar para Usuários"
//     .headerActions   → área direita do cabeçalho
//     .editBtn         → botão "Editar" (visível no modo view)
//     .cancelBtn       → botão "Cancelar" (visível no modo edit)
//     .panelBody       → área rolável com o conteúdo
//     .inner           → container interno com largura máxima centrada
//     .heroCard        → card de destaque: avatar grande + nome + badges
//     .heroAvatar      → círculo grande com as iniciais do usuário
//     .heroInfo        → coluna com nome, email e badges
//     .heroName        → nome completo (texto maior)
//     .heroEmail       → e-mail (texto menor)
//     .heroBadges      → linha de badges de status e verificação
//     .badge           → badge genérico (forma base)
//     .badge_active    → verde (status Ativo)
//     .badge_inactive  → vermelho (status Inativo)
//     .badge_success   → verde (verificação ok)
//     .badge_warning   → amarelo (verificação pendente)
//     .badge_danger    → vermelho (suspenso)
//     .alertSuccess    → caixa verde de mensagem de sucesso
//     .alertError      → caixa vermelha de mensagem de erro
//     .grid            → grade de cards de informação (modo view)
//     .infoCard        → card individual com ícone + rótulo + valor
//     .infoLabel       → linha com ícone + texto do rótulo
//     .infoValue       → valor da informação
//     .color_success   → cor verde para valores positivos
//     .color_warning   → cor amarela para valores de atenção
//     .color_danger    → cor vermelha para valores negativos
//     .mono            → fonte monospace (para IPs e dados técnicos)
//     .editForm        → formulário do modo edição
//     .editGrid        → grade de campos editáveis
//     .formGroup       → grupo label + campo
//     .label           → etiqueta do campo
//     .input           → campo de input (text, select)
//     .editNote        → nota informativa sobre campos desabilitados
//     .editActions     → linha com botões "Salvar" e "Cancelar"
//     .saveBtn         → botão de salvar as alterações
//     .spin            → animação de rotação no ícone Loader2
// ============================================================

import { useState } from "react";
import {
  IconChevronLeft,
  IconEdit,
  IconDeviceFloppy,
  IconX,
  IconUser,
  IconMail,
  IconPhone,
  IconBuilding,
  IconBook,
  IconShieldCheck,
  IconCircleCheck,
  IconAlertCircle,
  IconLoader2,
} from "@tabler/icons-react";
import { api } from "../services/api";
import styles from "./UserProfilePanel.module.css";

// VERIFICACAO_LABELS: traduz o código numérico de verificação para texto e cor.
// usu_verificacao é um campo da API que indica o estágio de verificação da conta.
const VERIFICACAO_LABELS = {
  0: { label: "Aguardando OTP", color: "warning" },
  1: { label: "Admin verificado", color: "success" },
  2: { label: "Verificado", color: "success" },
  5: { label: "Cadastro pendente", color: "warning" },
  6: { label: "Veículo pendente", color: "warning" },
  9: { label: "Suspenso", color: "danger" },
};

// getInitials: gera as iniciais do nome para o avatar.
// Ex: "Carlos Souza" → "CS", "Ana" → "AN" (primeiras 2 letras das 2 primeiras palavras)
function getInitials(name) {
  if (!name) return "?";
  return (
    name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?"
  );
}

// enrichUser: normaliza o objeto de usuário vindo da API para o formato
// esperado pelo painel. Todos os campos são lidos diretamente da resposta
// da API — não há mais dependência de dados mockados.
//
// Campos que o endpoint GET /api/admin/usuarios/:id pode retornar:
//   esc_nome / escola_nome → nome da instituição
//   cur_nome / curso_nome  → nome do curso
//   per_tipo               → papel (0=Usuário, 1=Admin, 2=Dev)
//
// Campos não retornados pela API aparecem como '—'.
const PER_TIPO_LABELS = { 0: 'Usuário', 1: 'Admin de Escola', 2: 'Desenvolvedor' };

function enrichUser(apiUser) {
  return {
    usu_id:        apiUser.usu_id,
    usu_nome:      apiUser.usu_nome,
    usu_email:     apiUser.usu_email,
    usu_status:    apiUser.usu_status ?? 1,
    usu_verificacao: apiUser.usu_verificacao ?? 0,
    usu_telefone:  apiUser.usu_telefone ?? null,
    usu_foto:      apiUser.usu_foto ?? null,
    school:        apiUser.esc_nome ?? apiUser.escola_nome ?? '—',
    course:        apiUser.cur_nome ?? apiUser.curso_nome ?? '—',
    type:          apiUser.per_tipo != null
                     ? (PER_TIPO_LABELS[apiUser.per_tipo] ?? 'Usuário')
                     : '—',
  };
}

export function UserProfilePanel({
  user,
  initialMode = "view",
  onClose,
  onUserUpdated,
}) {
  // enriched: versão normalizada do usuário (somente dados da API)
  const enriched = enrichUser(user);

  // mode: alterna entre 'view' (visualização) e 'edit' (edição)
  const [mode, setMode] = useState(initialMode);

  // photoError: true quando a foto da API falha ao carregar.
  // Nesse caso exibe as iniciais como fallback.
  const [photoError, setPhotoError] = useState(false);

  // form: estado dos campos editáveis.
  // Inicializado com os dados atuais do usuário.
  const [form, setForm] = useState({
    usu_nome: enriched.usu_nome,
    usu_telefone: enriched.usu_telefone ?? "",
    usu_status: enriched.usu_status,
  });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  // verif: objeto { label, color } com os dados de verificação para exibir no badge.
  // ?? → usa 'Desconhecido' se o código não estiver no mapa VERIFICACAO_LABELS.
  const verif = VERIFICACAO_LABELS[enriched.usu_verificacao] ?? {
    label: "Desconhecido",
    color: "neutral",
  };

  // handleFormChange: atualiza apenas o campo que mudou.
  // [name]: value → chave computada: usa o nome do campo como chave dinâmica.
  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess("");
    // Validação simples: nome não pode ser vazio.
    // .trim() remove espaços do início e fim antes de verificar.
    if (!form.usu_nome.trim()) {
      setSaveError("O nome não pode estar vazio.");
      return;
    }

    setSaving(true);
    try {
      await api.updateUser(enriched.usu_id, {
        usu_nome: form.usu_nome.trim(),
        usu_telefone: form.usu_telefone.trim() || null, // string vazia → null
        usu_status: Number(form.usu_status), // converte string → número
      });
      setSaveSuccess("Dados atualizados com sucesso.");
      setMode("view");

      // onUserUpdated?.() → chama a prop se fornecida (optional chaining).
      // Passa o usuário com os campos atualizados para que Usuarios.jsx
      // possa atualizar a tabela sem recarregar toda a lista da API.
      onUserUpdated?.({
        ...user,
        usu_nome: form.usu_nome.trim(),
        usu_status: Number(form.usu_status),
      });
    } catch (err) {
      setSaveError(err.message || "Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  }

  // handleCancelEdit: descarta as alterações e volta para o modo de visualização.
  function handleCancelEdit() {
    setForm({
      usu_nome: enriched.usu_nome,
      usu_telefone: enriched.usu_telefone ?? "",
      usu_status: enriched.usu_status,
    });
    setSaveError("");
    setMode("view");
  }

  return (
    <div className={styles.panel}>
      {/* ── Cabeçalho do painel ── */}
      <div className={styles.panelHeader}>
        {/* Botão de voltar: chama onClose para fechar o painel */}
        <button className={styles.backBtn} onClick={onClose}>
          <IconChevronLeft size={18} />
          Usuários
        </button>

        <div className={styles.headerActions}>
          {/* Exibe "Editar" no modo view e "Cancelar" no modo edit */}
          {mode === "view" ? (
            <button
              className={styles.editBtn}
              onClick={() => {
                setMode("edit");
                setSaveSuccess("");
                setSaveError("");
              }}
            >
              <IconEdit size={15} />
              Editar
            </button>
          ) : (
            <button className={styles.cancelBtn} onClick={handleCancelEdit}>
              <IconX size={15} />
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* ── Corpo do painel (área com scroll) ── */}
      <div className={styles.panelBody}>
        <div className={styles.inner}>
          {/* Card de destaque: avatar grande + nome + badges de status */}
          <div className={styles.heroCard}>
            {/* heroAvatar: exibe a foto do usuário se disponível; caso contrário mostra iniciais.
                photoError: fallback ativado quando a URL da foto retorna erro 404 ou similar. */}
            <div className={styles.heroAvatar}>
              {enriched.usu_foto && !photoError
                ? <img
                    src={enriched.usu_foto}
                    alt={enriched.usu_nome || 'avatar'}
                    style={{
                      width: '100%', height: '100%',
                      objectFit: 'cover', borderRadius: 'inherit'
                    }}
                    onError={() => setPhotoError(true)}
                  />
                : getInitials(enriched.usu_nome)}
            </div>
            <div className={styles.heroInfo}>
              <h2 className={styles.heroName}>{enriched.usu_nome}</h2>
              <p className={styles.heroEmail}>{enriched.usu_email}</p>
              <div className={styles.heroBadges}>
                {/* Badge de status: verde se Ativo, vermelho se Inativo.
                    O nome da classe é montado dinamicamente:
                    styles[`badge_active`] ou styles[`badge_inactive`] */}
                <span
                  className={`${styles.badge} ${styles[`badge_${enriched.usu_status === 1 ? "active" : "inactive"}`]}`}
                >
                  {enriched.usu_status === 1 ? "Ativo" : "Inativo"}
                </span>
                {/* Badge de verificação: cor vinda de VERIFICACAO_LABELS */}
                <span
                  className={`${styles.badge} ${styles[`badge_${verif.color}`]}`}
                >
                  {verif.label}
                </span>
                {/* Badge de tipo: só exibe se o tipo estiver preenchido */}
                {enriched.type !== "—" && (
                  <span className={styles.badge}>{enriched.type}</span>
                )}
              </div>
            </div>
          </div>

          {/* Mensagens de sucesso e erro */}
          {saveSuccess && (
            <div className={styles.alertSuccess}>
              <IconCircleCheck size={15} /> {saveSuccess}
            </div>
          )}
          {saveError && (
            <div className={styles.alertError}>
              <IconAlertCircle size={15} /> {saveError}
            </div>
          )}

          {/* ── Modo VISUALIZAÇÃO: grade de cards de informação ── */}
          {mode === "view" && (
            <div className={styles.grid}>
              {/* InfoCard: componente interno definido abaixo neste mesmo arquivo.
                  Recebe ícone, rótulo e valor para exibir de forma consistente. */}
              <InfoCard
                icon={IconUser}
                label="Nome completo"
                value={enriched.usu_nome}
              />
              <InfoCard icon={IconMail} label="E-mail" value={enriched.usu_email} />
              <InfoCard
                icon={IconPhone}
                label="Telefone"
                value={enriched.usu_telefone ? enriched.usu_telefone : "—"}
              />
              <InfoCard
                icon={IconBuilding}
                label="Instituição"
                value={enriched.school}
              />
              <InfoCard icon={IconBook} label="Curso" value={enriched.course} />
              <InfoCard
                icon={IconShieldCheck}
                label="Nível de verificação"
                value={verif.label}
                valueColor={verif.color}
              />
            </div>
          )}

          {/* ── Modo EDIÇÃO: formulário com campos editáveis ── */}
          {mode === "edit" && (
            <form className={styles.editForm} onSubmit={handleSave}>
              <div className={styles.editGrid}>
                {/* Campo: Nome */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <IconUser size={14} /> Nome completo
                  </label>
                  <input
                    name="usu_nome"
                    className={styles.input}
                    value={form.usu_nome}
                    onChange={handleFormChange}
                    placeholder="Nome completo"
                  />
                </div>

                {/* Campo: E-mail (desabilitado — não pode ser alterado pelo admin) */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <IconMail size={14} /> E-mail
                  </label>
                  <input
                    className={styles.input}
                    value={enriched.usu_email}
                    disabled // disabled → cinza, não editável
                    title="O e-mail não pode ser alterado"
                  />
                </div>

                {/* Campo: Telefone */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <IconPhone size={14} /> Telefone
                  </label>
                  <input
                    name="usu_telefone"
                    className={styles.input}
                    value={form.usu_telefone}
                    onChange={handleFormChange}
                    placeholder="(11) 99999-0000"
                  />
                </div>

                {/* Campo: Status da conta (dropdown Ativo/Inativo) */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <IconShieldCheck size={14} /> Status da conta
                  </label>
                  <select
                    name="usu_status"
                    className={styles.input}
                    value={form.usu_status}
                    onChange={handleFormChange}
                  >
                    <option value={1}>Ativo</option>
                    <option value={0}>Inativo</option>
                  </select>
                </div>

                {/* Campos desabilitados: pertence à instituição/usuário */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <IconBuilding size={14} /> Instituição
                  </label>
                  <input
                    className={styles.input}
                    value={enriched.school}
                    disabled
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <IconBook size={14} /> Curso
                  </label>
                  <input
                    className={styles.input}
                    value={enriched.course}
                    disabled
                  />
                </div>
              </div>

              <p className={styles.editNote}>
                Campos desabilitados são gerenciados pelo próprio usuário ou
                pela instituição.
              </p>

              <div className={styles.editActions}>
                {/* Botão salvar: mostra spinner enquanto está salvando */}
                <button
                  type="submit"
                  className={styles.saveBtn}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <IconLoader2 size={15} className={styles.spin} /> Salvando...
                    </>
                  ) : (
                    <>
                      <IconDeviceFloppy size={15} /> Salvar alterações
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={handleCancelEdit}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// InfoCard: componente interno de cartão de informação.
// Exibe um ícone, um rótulo e um valor de forma padronizada.
// Definido fora do componente principal para não ser recriado a cada render.
//
// Props:
//   icon       → componente de ícone do lucide-react
//   label      → texto do rótulo (ex: "Nome completo")
//   value      → valor a exibir (ex: "Carlos Silva")
//   valueColor → string opcional para cor semântica ('success', 'warning', 'danger')
//   mono       → boolean: se true, aplica fonte monospace ao valor
function InfoCard({ icon: Icon, label, value, valueColor, mono }) {
  return (
    <div className={styles.infoCard}>
      <div className={styles.infoLabel}>
        {/* Icon recebido como prop: <Icon size={13} /> renderiza o ícone */}
        <Icon size={13} />
        {label}
      </div>
      {/* styles.color_success / styles.color_warning / styles.color_danger
          são adicionados condicionalmente via template literal.
          styles.mono é adicionado apenas se a prop mono for true. */}
      <p
        className={`${styles.infoValue} ${valueColor ? styles[`color_${valueColor}`] : ""} ${mono ? styles.mono : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
