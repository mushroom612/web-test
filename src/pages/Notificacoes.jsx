// ============================================================
// pages/Notificacoes.jsx — Página de envio de notificações push
//
// Permite que administradores enviem notificações para os usuários
// da plataforma. Possui dois painéis lado a lado:
//   - Esquerdo: formulário para compor a notificação
//   - Direito:  preview visual de como a notificação aparecerá
//              no celular do usuário
//
// Funcionalidades:
//   - Título e mensagem livres
//   - Destinatários: todos os usuários OU um usuário específico (por ID)
//   - Quando "Usuário específico" é selecionado, um novo campo de ID aparece
//   - Feedback de sucesso ou erro após o envio
//
// Como funciona a prévia:
//   Os campos do formulário são refletidos em tempo real no painel direito,
//   que simula a aparência de uma notificação em um celular.
//   Se o usuário ainda não digitou nada, um texto placeholder aparece.
//
// Interligação:
//   - Importa: api.js (enviarNotificacao)
//   - Lucide React: Send
//
// Estilo: Notificacoes.module.css
//   Classes CSS utilizadas:
//     .container       → área raiz da página
//     .header          → cabeçalho com título e subtítulo
//     .title           → texto "Emitir Notificação"
//     .subtitle        → texto descritivo abaixo do título
//     .contentGrid     → layout de duas colunas (formulário + preview)
//     .formSection     → coluna esquerda com o formulário
//     .form            → elemento <form> com os campos
//     .formGroup       → agrupa cada label + campo (input/textarea/select)
//     .label           → texto da etiqueta do campo
//     .input           → campo de texto (título, ID do usuário)
//     .textarea        → campo de texto longo (mensagem)
//     .select          → dropdown de destinatários
//     .submitBtn       → botão de envio com ícone Send
//     .previewSection  → coluna direita com o preview visual
//     .previewTitle    → título "Preview (Celular)"
//     .phoneFrame      → moldura visual do celular
//     .phoneHeader     → barra superior do celular (mostra o horário)
//     .time            → texto "09:41" simulando o relógio do celular
//     .phoneContent    → área de conteúdo do celular
//     .notification    → card branco simulando a notificação push
//     .notifTitle      → título da notificação (negrito)
//     .notifMessage    → corpo do texto da notificação
// ============================================================

import { useState } from 'react';
import { IconSend } from '@tabler/icons-react';
import { api } from '../services/api';
import styles from './Notificacoes.module.css';

export function Notificacoes() {
  // formData: estado centralizado com todos os campos do formulário.
  // Usar um único objeto (em vez de vários useState) facilita o handleChange genérico.
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipients: 'todos',     // 'todos' ou 'usuario'
    specificUserId: ''        // ID numérico do usuário específico
  });

  const [loading, setLoading] = useState(false);

  // feedback: objeto { type, text } para mensagem de sucesso ou erro.
  // type: 'success' → texto verde | 'error' → texto vermelho
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // handleChange: atualiza apenas o campo que mudou no formData.
  // e.target.name → nome do campo HTML (ex: 'title', 'message')
  // e.target.value → novo valor digitado
  // O spread { ...prev } copia todos os campos anteriores e [name]: value
  // sobrescreve apenas o campo que mudou (usando chave computada).
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    // e.preventDefault() → evita o comportamento padrão do formulário
    // (que seria recarregar a página ao submeter)
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    setLoading(true);
    try {
      await api.enviarNotificacao({
        titulo: formData.title,
        mensagem: formData.message,
        tipo: 'AVISO',
        // usu_id: só é enviado se o destinatário for 'usuario' E o ID estiver preenchido.
        // O operador ternário retorna o ID convertido para número (Number())
        // ou `undefined` — campos undefined não são incluídos na requisição.
        usu_id: formData.recipients === 'usuario' && formData.specificUserId
          ? Number(formData.specificUserId)
          : undefined
      });
      setFeedback({ type: 'success', text: 'Notificação enviada com sucesso!' });
      // Limpa o formulário após o envio bem-sucedido
      setFormData({ title: '', message: '', recipients: 'todos', specificUserId: '' });
    } catch (err) {
      setFeedback({ type: 'error', text: `Erro ao enviar: ${err.message}` });
    } finally {
      // finally: executa sempre, independente de sucesso ou erro
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Emitir Notificação</h1>
        <p className={styles.subtitle}>Envie notificações para os usuários</p>
      </div>

      {/* Layout de duas colunas: formulário (esquerda) + preview (direita) */}
      <div className={styles.contentGrid}>

        {/* ── Coluna esquerda: formulário ── */}
        <div className={styles.formSection}>
          <form className={styles.form} onSubmit={handleSubmit}>

            {/* Campo: Título */}
            <div className={styles.formGroup}>
              <label htmlFor="title" className={styles.label}>
                Título
              </label>
              <input
                type="text"
                id="title"
                name="title"           // corresponde à chave em formData
                className={styles.input}
                placeholder="Digite o título da notificação"
                value={formData.title}
                onChange={handleChange}
                required               // impede envio sem título
              />
            </div>

            {/* Campo: Mensagem (textarea = campo de texto grande) */}
            <div className={styles.formGroup}>
              <label htmlFor="message" className={styles.label}>
                Mensagem
              </label>
              <textarea
                id="message"
                name="message"
                className={styles.textarea}
                placeholder="Digite a mensagem da notificação"
                value={formData.message}
                onChange={handleChange}
                rows={6}               // altura inicial em linhas
                required
              />
            </div>

            {/* Campo: Destinatários (dropdown) */}
            <div className={styles.formGroup}>
              <label htmlFor="recipients" className={styles.label}>
                Destinatários
              </label>
              <select
                id="recipients"
                name="recipients"
                className={styles.select}
                value={formData.recipients}
                onChange={handleChange}
              >
                <option value="todos">Todos os usuários</option>
                <option value="usuario">Usuário específico (por ID)</option>
              </select>
            </div>

            {/* Campo de ID: só aparece quando "Usuário específico" está selecionado.
                Renderização condicional: {formData.recipients === 'usuario' && (...)}
                — se a condição for false, o campo simplesmente não é renderizado. */}
            {formData.recipients === 'usuario' && (
              <div className={styles.formGroup}>
                <label htmlFor="specificUserId" className={styles.label}>
                  ID do Usuário
                </label>
                <input
                  type="number"
                  id="specificUserId"
                  name="specificUserId"
                  className={styles.input}
                  placeholder="Ex: 42"
                  value={formData.specificUserId}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            {/* Mensagem de feedback: verde para sucesso, vermelho para erro.
                O estilo é definido inline pois depende do tipo de feedback. */}
            {feedback.text && (
              <p
                style={{
                  color: feedback.type === 'success' ? '#047857' : '#b91c1c',
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem'
                }}
              >
                {feedback.text}
              </p>
            )}

            {/* Botão de envio: desabilitado enquanto está enviando */}
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              <IconSend size={18} />
              {loading ? 'Enviando...' : 'Enviar Notificação'}
            </button>
          </form>
        </div>

        {/* ── Coluna direita: preview visual do celular ── */}
        <div className={styles.previewSection}>
          <h3 className={styles.previewTitle}>Preview (Celular)</h3>

          {/* Simulação visual de um celular com a notificação */}
          <div className={styles.phoneFrame}>
            {/* Barra superior do celular com horário */}
            <div className={styles.phoneHeader}>
              <span className={styles.time}>09:41</span>
            </div>

            {/* Área de conteúdo: onde a notificação apareceria */}
            <div className={styles.phoneContent}>
              <div className={styles.notification}>
                {/* Título da notificação: mostra o que foi digitado no formulário,
                    ou um placeholder se o campo estiver vazio */}
                <p className={styles.notifTitle}>
                  {formData.title || 'Título da notificação'}
                </p>
                <p className={styles.notifMessage}>
                  {formData.message || 'Sua notificação aparecerá aqui...'}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
