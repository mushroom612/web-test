import { useState, useEffect } from 'react';
import {
  Building2, MapPin, Mail, Users, Trash2,
  UserPlus, Search, X, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { api } from '../services/api';
import styles from './Cadastrar.module.css';
export function Cadastrar() {
  const [formData, setFormData] = useState({
    esc_nome: '',
    esc_endereco: '',
    esc_dominio: '',
    esc_max_usuarios: ''
  });

  const [adminSearch, setAdminSearch] = useState('');
  const [adminSearchResult, setAdminSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [pendingAdmins, setPendingAdmins] = useState([]);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const [institutions, setInstitutions] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  useEffect(() => {
    loadInstitutions();
  }, []);

  async function loadInstitutions() {
    setListLoading(true);
    setListError('');
    try {
      const data = await api.getSchools();
      setInstitutions(Array.isArray(data) ? data : data.escolas ?? []);
    } catch (err) {
      setListError(err.message || 'Não foi possível carregar as instituições.');
    } finally {
      setListLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSearchAdmin(e) {
    e.preventDefault();
    if (!adminSearch.trim()) return;
    setSearchLoading(true);
    setSearchError('');
    setAdminSearchResult(null);
    try {
      const data = await api.searchUsers(adminSearch.trim());
      const users = Array.isArray(data) ? data : data.usuarios ?? [];
      if (users.length === 0) {
        setSearchError('Nenhum usuário encontrado com esse termo.');
      } else {
        setAdminSearchResult(users[0]);
      }
    } catch (err) {
      setSearchError(err.message || 'Erro ao buscar usuário.');
    } finally {
      setSearchLoading(false);
    }
  }

  function handleAddAdmin() {
    if (!adminSearchResult) return;
    const alreadyAdded = pendingAdmins.some(a => a.usu_id === adminSearchResult.usu_id);
    if (alreadyAdded) {
      setSearchError('Este usuário já foi adicionado à lista.');
      return;
    }
    setPendingAdmins(prev => [...prev, adminSearchResult]);
    setAdminSearchResult(null);
    setAdminSearch('');
    setSearchError('');
  }

  function handleRemoveAdmin(userId) {
    setPendingAdmins(prev => prev.filter(a => a.usu_id !== userId));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setSubmitLoading(true);

    try {
      const payload = {
        esc_nome: formData.esc_nome,
        esc_endereco: formData.esc_endereco,
        ...(formData.esc_dominio ? { esc_dominio: formData.esc_dominio } : {}),
        ...(formData.esc_max_usuarios ? { esc_max_usuarios: parseInt(formData.esc_max_usuarios) } : {})
      };

      const created = await api.createSchool(payload);
      const escId = created.escola?.esc_id;

      const adminErrors = [];
      for (const admin of pendingAdmins) {
        try {
          await api.updateUserProfile(admin.usu_id, { per_tipo: 1, per_escola_id: escId });
        } catch {
          adminErrors.push(admin.usu_nome ?? admin.usu_email ?? `ID ${admin.usu_id}`);
        }
      }

      setSubmitSuccess(
        adminErrors.length > 0
          ? `Instituição cadastrada, mas houve erro ao vincular: ${adminErrors.join(', ')}.`
          : `Instituição "${formData.esc_nome}" cadastrada com sucesso!`
      );

      setFormData({ esc_nome: '', esc_endereco: '', esc_dominio: '', esc_max_usuarios: '' });
      setPendingAdmins([]);
      setAdminSearch('');
      setAdminSearchResult(null);
      loadInstitutions();
    } catch (err) {
      setSubmitError(err.message || 'Erro ao cadastrar instituição.');
    } finally {
      setSubmitLoading(false);
    }
  }

  function handleReset() {
    setFormData({ esc_nome: '', esc_endereco: '', esc_dominio: '', esc_max_usuarios: '' });
    setPendingAdmins([]);
    setAdminSearch('');
    setAdminSearchResult(null);
    setSearchError('');
    setSubmitError('');
    setSubmitSuccess('');
  }

  async function handleDeleteInstitution(id) {
    if (!window.confirm('Tem certeza que deseja remover esta instituição?')) return;
    try {
      await api.deleteSchool(id);
      loadInstitutions();
    } catch (err) {
      alert(err.message || 'Erro ao remover instituição.');
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Cadastrar Instituição</h1>
        <p className={styles.subtitle}>
          Adicione uma nova instituição e defina seus administradores
        </p>
      </div>

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit}>
          {/* Seção 1: Dados da Instituição */}
          <div className={styles.sectionHeader}>
            <Building2 size={18} />
            <span>Dados da Instituição</span>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="esc_nome" className={styles.label}>
                Nome da Instituição <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="esc_nome"
                name="esc_nome"
                className={styles.input}
                placeholder="Ex: Faculdade Tecnológica Inova"
                value={formData.esc_nome}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="esc_endereco" className={styles.label}>
                <MapPin size={14} /> Endereço <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="esc_endereco"
                name="esc_endereco"
                className={styles.input}
                placeholder="Ex: Av. Paulista, 1000, São Paulo - SP"
                value={formData.esc_endereco}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="esc_dominio" className={styles.label}>
                <Mail size={14} /> Domínio de E-mail
              </label>
              <input
                type="text"
                id="esc_dominio"
                name="esc_dominio"
                className={styles.input}
                placeholder="Ex: inova.edu.br"
                value={formData.esc_dominio}
                onChange={handleChange}
              />
              <span className={styles.fieldHint}>Restringe cadastros ao domínio informado</span>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="esc_max_usuarios" className={styles.label}>
                <Users size={14} /> Limite de Usuários
              </label>
              <input
                type="number"
                id="esc_max_usuarios"
                name="esc_max_usuarios"
                className={styles.input}
                placeholder="Ex: 200"
                value={formData.esc_max_usuarios}
                onChange={handleChange}
                min="1"
              />
              <span className={styles.fieldHint}>Deixe vazio para sem limite</span>
            </div>
          </div>

          {/* Seção 2: Administradores */}
          <div className={styles.divider} />

          <div className={styles.sectionHeader}>
            <UserPlus size={18} />
            <span>Administradores da Instituição</span>
          </div>

          <p className={styles.sectionDescription}>
            Busque usuários pelo e-mail ou nome para vinculá-los como administradores desta instituição.
          </p>

          <div className={styles.searchRow}>
            <input
              type="text"
              className={styles.input}
              placeholder="Buscar usuário por e-mail ou nome..."
              value={adminSearch}
              onChange={e => setAdminSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearchAdmin(e)}
            />
            <button
              type="button"
              className={styles.searchBtn}
              onClick={handleSearchAdmin}
              disabled={searchLoading || !adminSearch.trim()}
            >
              {searchLoading
                ? <Loader2 size={16} className={styles.spin} />
                : <Search size={16} />}
              Buscar
            </button>
          </div>

          {searchError && (
            <p className={styles.inlineError}>{searchError}</p>
          )}

          {adminSearchResult && (
            <div className={styles.userFound}>
              <div className={styles.userAvatar}>
                {(adminSearchResult.usu_nome ?? adminSearchResult.usu_email ?? '?')[0].toUpperCase()}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>
                  {adminSearchResult.usu_nome ?? '—'}
                </span>
                <span className={styles.userEmail}>{adminSearchResult.usu_email}</span>
              </div>
              <button type="button" className={styles.addAdminBtn} onClick={handleAddAdmin}>
                <UserPlus size={14} /> Adicionar
              </button>
            </div>
          )}

          {pendingAdmins.length > 0 && (
            <div className={styles.adminList}>
              <p className={styles.adminListLabel}>Administradores a vincular:</p>
              {pendingAdmins.map(admin => (
                <div key={admin.usu_id} className={styles.adminTag}>
                  <span className={styles.adminTagAvatar}>
                    {(admin.usu_nome ?? admin.usu_email ?? '?')[0].toUpperCase()}
                  </span>
                  <span className={styles.adminTagName}>
                    {admin.usu_nome ?? admin.usu_email}
                  </span>
                  <span className={styles.adminTagEmail}>{admin.usu_email}</span>
                  <button
                    type="button"
                    className={styles.removeAdminBtn}
                    onClick={() => handleRemoveAdmin(admin.usu_id)}
                    title="Remover"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Feedback do submit */}
          {submitSuccess && (
            <div className={styles.alertSuccess}>
              <CheckCircle size={16} />
              {submitSuccess}
            </div>
          )}
          {submitError && (
            <div className={styles.alertError}>
              <AlertCircle size={16} />
              {submitError}
            </div>
          )}

          {/* Ações */}
          <div className={styles.formActions}>
            <button type="submit" className={styles.submitBtn} disabled={submitLoading}>
              {submitLoading
                ? <><Loader2 size={16} className={styles.spin} /> Cadastrando...</>
                : 'Cadastrar Instituição'}
            </button>
            <button type="button" className={styles.cancelBtn} onClick={handleReset}>
              Limpar
            </button>
          </div>
        </form>
      </div>

      {/* Lista de Instituições */}
      <div className={styles.institutionsSection}>
        <h2 className={styles.sectionTitle}>Instituições Cadastradas</h2>

        {listLoading && (
          <div className={styles.loadingState}>
            <Loader2 size={20} className={styles.spin} />
            <span>Carregando instituições...</span>
          </div>
        )}

        {listError && !listLoading && (
          <div className={styles.alertError} style={{ marginBottom: 16 }}>
            <AlertCircle size={16} />
            {listError}
          </div>
        )}

        {!listLoading && !listError && institutions.length === 0 && (
          <div className={styles.emptyState}>
            <Building2 size={32} />
            <p>Nenhuma instituição cadastrada ainda.</p>
          </div>
        )}

        {!listLoading && institutions.length > 0 && (
          <div className={styles.institutionsList}>
            {institutions.map(inst => (
              <div key={inst.esc_id ?? inst.id} className={styles.institutionCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.institutionInfo}>
                    <h3 className={styles.institutionName}>{inst.esc_nome}</h3>
                    <p className={styles.institutionAddress}>
                      <MapPin size={12} /> {inst.esc_endereco}
                    </p>
                  </div>
                  <button
                    className={styles.iconBtn}
                    onClick={() => handleDeleteInstitution(inst.esc_id ?? inst.id)}
                    title="Remover instituição"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className={styles.cardContent}>
                  <div className={styles.institutionDetails}>
                    {inst.esc_dominio && (
                      <div className={styles.detailItem}>
                        <Mail size={13} />
                        <span className={styles.detailLabel}>Domínio:</span>
                        <span className={styles.detailValue}>{inst.esc_dominio}</span>
                      </div>
                    )}
                    {inst.esc_max_usuarios && (
                      <div className={styles.detailItem}>
                        <Users size={13} />
                        <span className={styles.detailLabel}>Limite:</span>
                        <span className={styles.detailValue}>{inst.esc_max_usuarios} usuários</span>
                      </div>
                    )}
                    {!inst.esc_dominio && !inst.esc_max_usuarios && (
                      <span className={styles.noRestrictions}>Sem restrições configuradas</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
