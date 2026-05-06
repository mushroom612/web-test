import { useState } from 'react';
import { Send } from 'lucide-react';
import { api } from '../services/api';
import styles from './Notificacoes.module.css';

export function Notificacoes() {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipients: 'todos',
    specificUserId: ''
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    setLoading(true);
    try {
      await api.enviarNotificacao({
        titulo: formData.title,
        mensagem: formData.message,
        tipo: 'AVISO',
        usu_id: formData.recipients === 'usuario' && formData.specificUserId
          ? Number(formData.specificUserId)
          : undefined
      });
      setFeedback({ type: 'success', text: 'Notificação enviada com sucesso!' });
      setFormData({ title: '', message: '', recipients: 'todos', specificUserId: '' });
    } catch (err) {
      setFeedback({ type: 'error', text: `Erro ao enviar: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Emitir Notificação</h1>
        <p className={styles.subtitle}>Envie notificações para os usuários</p>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.formSection}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="title" className={styles.label}>
                Título
              </label>
              <input
                type="text"
                id="title"
                name="title"
                className={styles.input}
                placeholder="Digite o título da notificação"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

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
                rows={6}
                required
              />
            </div>

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

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              <Send size={18} />
              {loading ? 'Enviando...' : 'Enviar Notificação'}
            </button>
          </form>
        </div>

        <div className={styles.previewSection}>
          <h3 className={styles.previewTitle}>Preview (Celular)</h3>
          <div className={styles.phoneFrame}>
            <div className={styles.phoneHeader}>
              <span className={styles.time}>09:41</span>
            </div>
            <div className={styles.phoneContent}>
              <div className={styles.notification}>
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
