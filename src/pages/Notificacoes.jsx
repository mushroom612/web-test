import { useState } from 'react';
import { Send } from 'lucide-react';
import styles from './Notificacoes.module.css';

export function Notificacoes() {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipients: 'todos'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Notificação enviada:', formData);
    alert('Notificação enviada com sucesso!');
    setFormData({
      title: '',
      message: '',
      recipients: 'todos'
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Emitir Notificação</h1>
        <p className={styles.subtitle}>Envie notificações para os usuários</p>
      </div>

      <div className={styles.contentGrid}>
        {/* Formulário */}
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
                <option value="motoristas">Apenas motoristas</option>
                <option value="passageiros">Apenas passageiros</option>
                <option value="curso">Por curso</option>
                <option value="usuario">Usuário específico</option>
              </select>
            </div>

            <button type="submit" className={styles.submitBtn}>
              <Send size={18} />
              Enviar Notificação
            </button>
          </form>
        </div>

        {/* Preview */}
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
