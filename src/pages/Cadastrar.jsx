import { useState } from 'react';
import styles from './Cadastrar.module.css';

export function Cadastrar() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    registration: '',
    course: '',
    institution: '',
    type: 'Passageiro',
    password: ''
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
    console.log('Formulário enviado:', formData);
    alert('Usuário cadastrado com sucesso!');
    setFormData({
      fullName: '',
      email: '',
      registration: '',
      course: '',
      institution: '',
      type: 'Passageiro',
      password: ''
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Cadastrar Usuário</h1>
        <p className={styles.subtitle}>Adicione um novo usuário ao sistema</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="fullName" className={styles.label}>
              Nome Completo
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              className={styles.input}
              placeholder="Digite o nome completo"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              E-mail Institucional
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className={styles.input}
              placeholder="usuario@universidad.edu.br"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="registration" className={styles.label}>
              Matrícula
            </label>
            <input
              type="text"
              id="registration"
              name="registration"
              className={styles.input}
              placeholder="2024001234"
              value={formData.registration}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="course" className={styles.label}>
              Curso
            </label>
            <input
              type="text"
              id="course"
              name="course"
              className={styles.input}
              placeholder="Engenharia de Software"
              value={formData.course}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="institution" className={styles.label}>
              Instituição
            </label>
            <input
              type="text"
              id="institution"
              name="institution"
              className={styles.input}
              placeholder="Universidade XYZ"
              value={formData.institution}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="type" className={styles.label}>
              Tipo de Usuário
            </label>
            <select
              id="type"
              name="type"
              className={styles.select}
              value={formData.type}
              onChange={handleChange}
            >
              <option value="Passageiro">Passageiro</option>
              <option value="Motorista">Motorista</option>
              <option value="Ambos">Ambos</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Senha
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className={styles.input}
              placeholder="Digite a senha"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.submitBtn}>
            Salvar
          </button>
          <button type="reset" className={styles.cancelBtn}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
