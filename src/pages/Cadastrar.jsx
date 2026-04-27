import { useState } from 'react';
import { Building2, MapPin, Mail, Users, Trash2, Edit2 } from 'lucide-react';
import { usersData } from '../data/mockData';
import { StatusBadge } from '../components/StatusBadge';
import styles from './Cadastrar.module.css';

export function Cadastrar() {
  const [formData, setFormData] = useState({
    schoolName: '',
    address: '',
    emailDomain: '',
    maxUsers: '',
    description: ''
  });

  const [institutions, setInstitutions] = useState([
    {
      id: 1,
      name: 'Faculdade Tecnológica Inova',
      address: 'Av. Paulista, 1000, São Paulo - SP',
      emailDomain: 'inova.edu.br',
      maxUsers: 100,
      description: 'Instituição focada em tecnologia e inovação'
    },
    {
      id: 2,
      name: 'Universidade Estadual do Saber',
      address: 'Rua dos Estudos, 500, Campinas - SP',
      emailDomain: 'saber.edu.br',
      maxUsers: 50,
      description: 'Universidade com excelência em ensino'
    },
    {
      id: 3,
      name: 'Instituto Federal do Oeste',
      address: 'Rua da Ciência, 300, Araçatuba - SP',
      emailDomain: null,
      maxUsers: null,
      description: 'Instituto com foco em educação profissional'
    }
  ]);

  // Agrupar usuários por instituição
  const getUsersBySchool = (schoolName) => {
    return usersData.filter(user => user.school === schoolName);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newInstitution = {
      id: institutions.length + 1,
      name: formData.schoolName,
      address: formData.address,
      emailDomain: formData.emailDomain || null,
      maxUsers: formData.maxUsers ? parseInt(formData.maxUsers) : null,
      description: formData.description
    };

    setInstitutions([...institutions, newInstitution]);
    alert('Instituição cadastrada com sucesso!');
    setFormData({
      schoolName: '',
      address: '',
      emailDomain: '',
      maxUsers: '',
      description: ''
    });
  };

  const handleDeleteInstitution = (id) => {
    if (window.confirm('Tem certeza que deseja deletar esta instituição?')) {
      setInstitutions(institutions.filter(inst => inst.id !== id));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Cadastrar Instituição</h1>
        <p className={styles.subtitle}>Adicione uma nova instituição ao sistema para que seus estudantes possam se registrar</p>
      </div>

      <div className={styles.contentGrid}>
        {/* Formulário de Cadastro */}
        <div className={styles.formSection}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="schoolName" className={styles.label}>
                  <Building2 size={16} /> Nome da Instituição
                </label>
                <input
                  type="text"
                  id="schoolName"
                  name="schoolName"
                  className={styles.input}
                  placeholder="Ex: Faculdade Tecnológica Inova"
                  value={formData.schoolName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="address" className={styles.label}>
                  <MapPin size={16} /> Endereço
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  className={styles.input}
                  placeholder="Ex: Av. Paulista, 1000, São Paulo - SP"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="emailDomain" className={styles.label}>
                  <Mail size={16} /> Domínio de E-mail
                </label>
                <input
                  type="text"
                  id="emailDomain"
                  name="emailDomain"
                  className={styles.input}
                  placeholder="Ex: inova.edu.br"
                  value={formData.emailDomain}
                  onChange={handleChange}
                />
                <span className={styles.fieldHint}>Deixe vazio se não houver restrição de domínio</span>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="maxUsers" className={styles.label}>
                  <Users size={16} /> Limite Máximo de Usuários
                </label>
                <input
                  type="number"
                  id="maxUsers"
                  name="maxUsers"
                  className={styles.input}
                  placeholder="Ex: 100"
                  value={formData.maxUsers}
                  onChange={handleChange}
                  min="1"
                />
                <span className={styles.fieldHint}>Deixe vazio para sem limite</span>
              </div>

              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="description" className={styles.label}>
                  Descrição (Opcional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  className={styles.textarea}
                  placeholder="Informações adicionais sobre a instituição"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.submitBtn}>
                Cadastrar Instituição
              </button>
              <button type="reset" className={styles.cancelBtn}>
                Limpar
              </button>
            </div>
          </form>
        </div>
      </div>

         
    </div>
  );
}
