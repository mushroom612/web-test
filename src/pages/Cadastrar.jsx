import { useState, useEffect } from 'react';
import {
  Building2, MapPin, Mail, Users, Trash2,
  UserPlus, X, CheckCircle, AlertCircle, Loader2,
  ChevronRight, ChevronLeft, BookOpen, Pencil, Plus, ChevronDown, ChevronUp
} from 'lucide-react';
import { api } from '../services/api';
import styles from './Cadastrar.module.css';

const EMPTY_COURSE = { cur_nome: '', cur_descricao: '', cur_semestres: '' };

export function Cadastrar() {
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState('');

  const [formData, setFormData] = useState({
    esc_nome: '',
    esc_endereco: '',
    esc_dominio: '',
    esc_max_usuarios: ''
  });

  const [adminData, setAdminData] = useState({
    usu_nome: '',
    usu_email: '',
    usu_telefone: '',
    usu_senha: '',
    usu_confirmSenha: ''
  });

  // ── Cursos (etapa 3 - pré-cadastro) ────────────────────────────────────────
  const [coursesList, setCoursesList] = useState([]);
  const [newCourse, setNewCourse] = useState(EMPTY_COURSE);
  const [editingCourseId, setEditingCourseId] = useState(null);

  // ── Submit / feedback ──────────────────────────────────────────────────────
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // ── Lista de instituições ──────────────────────────────────────────────────
  const [institutions, setInstitutions] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  // ── Gerenciamento de cursos por instituição ────────────────────────────────
  const [expandedInstitution, setExpandedInstitution] = useState(null);
  const [institutionCourses, setInstitutionCourses] = useState({});
  const [instCourseLoading, setInstCourseLoading] = useState({});
  const [instCourseAction, setInstCourseAction] = useState(null); // { type: 'add'|'edit', escId, course? }
  const [instCourseForm, setInstCourseForm] = useState(EMPTY_COURSE);
  const [instCourseError, setInstCourseError] = useState('');

  useEffect(() => { loadInstitutions(); }, []);

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

  async function loadInstCourses(escId) {
    setInstCourseLoading(prev => ({ ...prev, [escId]: true }));
    try {
      const courses = await api.getCourses(escId);
      setInstitutionCourses(prev => ({ ...prev, [escId]: Array.isArray(courses) ? courses : [] }));
    } catch {
      setInstitutionCourses(prev => ({ ...prev, [escId]: [] }));
    } finally {
      setInstCourseLoading(prev => ({ ...prev, [escId]: false }));
    }
  }

  // ── Handlers gerais ────────────────────────────────────────────────────────

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function handleAdminChange(e) {
    const { name, value } = e.target;
    setAdminData(prev => ({ ...prev, [name]: value }));
  }

  function handleCourseChange(e) {
    const { name, value } = e.target;
    setNewCourse(prev => ({ ...prev, [name]: value }));
  }

  // ── Cursos na etapa 3 ──────────────────────────────────────────────────────

  function handleAddCourse() {
    if (!newCourse.cur_nome.trim()) {
      setStepError('Preencha o nome do curso.');
      return;
    }
    if (editingCourseId !== null) {
      setCoursesList(prev =>
        prev.map(c => c.cur_id === editingCourseId ? { ...newCourse, cur_id: editingCourseId } : c)
      );
      setEditingCourseId(null);
    } else {
      setCoursesList(prev => [...prev, { ...newCourse, cur_id: Date.now() }]);
    }
    setNewCourse(EMPTY_COURSE);
    setStepError('');
  }

  function handleEditCourse(course) {
    setEditingCourseId(course.cur_id);
    setNewCourse({
      cur_nome: course.cur_nome,
      cur_descricao: course.cur_descricao || '',
      cur_semestres: course.cur_semestres != null ? String(course.cur_semestres) : ''
    });
    setStepError('');
  }

  function handleCancelCourseEdit() {
    setEditingCourseId(null);
    setNewCourse(EMPTY_COURSE);
    setStepError('');
  }

  function handleRemoveCourse(courseId) {
    setCoursesList(prev => prev.filter(c => c.cur_id !== courseId));
    if (editingCourseId === courseId) {
      setEditingCourseId(null);
      setNewCourse(EMPTY_COURSE);
    }
  }

  // ── Navegação entre etapas ─────────────────────────────────────────────────

  function handleNextStep() {
    setStepError('');
    if (step === 1) {
      if (!formData.esc_nome.trim() || !formData.esc_endereco.trim()) {
        setStepError('Preencha os campos obrigatórios antes de continuar.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!adminData.usu_nome.trim() || !adminData.usu_email.trim() || !adminData.usu_senha.trim()) {
        setStepError('Preencha os campos obrigatórios do administrador.');
        return;
      }
      if (adminData.usu_senha !== adminData.usu_confirmSenha) {
        setStepError('As senhas não coincidem.');
        return;
      }
      setStep(3);
    }
  }

  function handlePrevStep() {
    setStepError('');
    setStep(step > 1 ? step - 1 : 1);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setSubmitLoading(true);

    try {
      const adminPayload = {
        usu_nome: adminData.usu_nome,
        usu_email: adminData.usu_email,
        usu_telefone: adminData.usu_telefone || null,
        per_tipo: 1
      };
      const createdAdmin = await api.createUser(adminPayload);
      const newAdminId = createdAdmin.usuario?.usu_id;

      const schoolPayload = {
        esc_nome: formData.esc_nome,
        esc_endereco: formData.esc_endereco,
        ...(formData.esc_dominio ? { esc_dominio: formData.esc_dominio } : {}),
        ...(formData.esc_max_usuarios ? { esc_max_usuarios: parseInt(formData.esc_max_usuarios) } : {})
      };
      const createdSchool = await api.createSchool(schoolPayload);
      const escId = createdSchool.escola?.esc_id || createdSchool.esc_id;

      await api.updateUserProfile(newAdminId, { per_tipo: 1, per_escola_id: escId });

      const courseErrors = [];
      for (const course of coursesList) {
        try {
          await api.createCourse({
            cur_nome: course.cur_nome,
            cur_descricao: course.cur_descricao || null,
            cur_semestres: course.cur_semestres ? parseInt(course.cur_semestres) : null,
            esc_id: escId,
            cur_ativo: 1
          });
        } catch {
          courseErrors.push(course.cur_nome);
        }
      }

      let successMsg = `Instituição "${formData.esc_nome}" cadastrada com sucesso!`;
      if (courseErrors.length > 0) {
        successMsg += ` Erro ao criar: ${courseErrors.join(', ')}.`;
      } else if (coursesList.length > 0) {
        successMsg += ` ${coursesList.length} curso(s) cadastrado(s).`;
      }
      setSubmitSuccess(successMsg);
      handleReset();
      loadInstitutions();
    } catch (err) {
      setSubmitError(err.message || 'Erro ao cadastrar instituição.');
    } finally {
      setSubmitLoading(false);
    }
  }

  function handleReset() {
    setStep(1);
    setStepError('');
    setFormData({ esc_nome: '', esc_endereco: '', esc_dominio: '', esc_max_usuarios: '' });
    setAdminData({ usu_nome: '', usu_email: '', usu_telefone: '', usu_senha: '', usu_confirmSenha: '' });
    setCoursesList([]);
    setNewCourse(EMPTY_COURSE);
    setEditingCourseId(null);
    setSubmitError('');
    setSubmitSuccess('');
  }

  async function handleDeleteInstitution(id) {
    if (!window.confirm('Tem certeza que deseja remover esta instituição?')) return;
    try {
      await api.deleteSchool(id);
      if (expandedInstitution === id) setExpandedInstitution(null);
      loadInstitutions();
    } catch (err) {
      alert(err.message || 'Erro ao remover instituição.');
    }
  }

  // ── Gerenciamento de cursos por instituição ────────────────────────────────

  function handleToggleInstitution(escId) {
    if (expandedInstitution === escId) {
      setExpandedInstitution(null);
      setInstCourseAction(null);
      setInstCourseForm(EMPTY_COURSE);
      setInstCourseError('');
      return;
    }
    setExpandedInstitution(escId);
    setInstCourseAction(null);
    setInstCourseForm(EMPTY_COURSE);
    setInstCourseError('');
    if (!institutionCourses[escId]) {
      loadInstCourses(escId);
    }
  }

  function handleStartAddInstCourse(escId) {
    setInstCourseAction({ type: 'add', escId });
    setInstCourseForm(EMPTY_COURSE);
    setInstCourseError('');
  }

  function handleStartEditInstCourse(escId, course) {
    setInstCourseAction({ type: 'edit', escId, course });
    setInstCourseForm({
      cur_nome: course.cur_nome,
      cur_descricao: course.cur_descricao || '',
      cur_semestres: course.cur_semestres != null ? String(course.cur_semestres) : ''
    });
    setInstCourseError('');
  }

  function handleCancelInstCourseAction() {
    setInstCourseAction(null);
    setInstCourseForm(EMPTY_COURSE);
    setInstCourseError('');
  }

  function handleInstCourseFormChange(e) {
    const { name, value } = e.target;
    setInstCourseForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSaveInstCourse() {
    if (!instCourseForm.cur_nome.trim()) {
      setInstCourseError('Preencha o nome do curso.');
      return;
    }
    const { type, escId, course } = instCourseAction;
    const payload = {
      cur_nome: instCourseForm.cur_nome,
      cur_descricao: instCourseForm.cur_descricao || null,
      cur_semestres: instCourseForm.cur_semestres ? parseInt(instCourseForm.cur_semestres) : null
    };
    try {
      if (type === 'add') {
        const created = await api.createCourse({ ...payload, esc_id: escId, cur_ativo: 1 });
        setInstitutionCourses(prev => ({ ...prev, [escId]: [...(prev[escId] || []), created] }));
      } else {
        const updated = await api.updateCourse(course.cur_id, payload);
        setInstitutionCourses(prev => ({
          ...prev,
          [escId]: prev[escId].map(c => c.cur_id === course.cur_id ? updated : c)
        }));
      }
      setInstCourseAction(null);
      setInstCourseForm(EMPTY_COURSE);
      setInstCourseError('');
    } catch (err) {
      setInstCourseError(err.message || 'Erro ao salvar curso.');
    }
  }

  async function handleDeleteInstCourse(escId, courseId) {
    if (!window.confirm('Remover este curso?')) return;
    try {
      await api.deleteCourse(courseId);
      setInstitutionCourses(prev => ({
        ...prev,
        [escId]: prev[escId].filter(c => c.cur_id !== courseId)
      }));
      if (instCourseAction?.course?.cur_id === courseId) {
        setInstCourseAction(null);
        setInstCourseForm(EMPTY_COURSE);
      }
    } catch (err) {
      alert(err.message || 'Erro ao remover curso.');
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const showCourseBtn = editingCourseId !== null || newCourse.cur_nome.trim() || newCourse.cur_descricao.trim() || newCourse.cur_semestres.trim();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Cadastrar Instituição</h1>
        <p className={styles.subtitle}>Adicione uma nova instituição e defina seus administradores</p>
      </div>

      <div className={styles.formCard}>
        {/* Indicador de etapas */}
        <div className={styles.stepIndicator}>
          <div className={`${styles.stepItem} ${step >= 1 ? styles.stepActive : ''}`}>
            <div className={styles.stepCircle}>1</div>
            <span className={styles.stepLabel}>Dados da Escola</span>
          </div>
          <div className={`${styles.stepLine} ${step >= 2 ? styles.stepLineDone : ''}`} />
          <div className={`${styles.stepItem} ${step >= 2 ? styles.stepActive : ''}`}>
            <div className={styles.stepCircle}>2</div>
            <span className={styles.stepLabel}>Administrador</span>
          </div>
          <div className={`${styles.stepLine} ${step >= 3 ? styles.stepLineDone : ''}`} />
          <div className={`${styles.stepItem} ${step >= 3 ? styles.stepActive : ''}`}>
            <div className={styles.stepCircle}>3</div>
            <span className={styles.stepLabel}>Cursos</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ── Etapa 1 ─────────────────────────────────────────────────── */}
          {step === 1 && (
            <>
              <div className={styles.sectionHeader}>
                <Building2 size={18} />
                <span>Dados da Escola</span>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="esc_nome" className={styles.label}>
                    Nome da Instituição <span className={styles.required}>*</span>
                  </label>
                  <input type="text" id="esc_nome" name="esc_nome" className={styles.input}
                    placeholder="Ex: Faculdade Tecnológica Inova"
                    value={formData.esc_nome} onChange={handleChange} />
                </div>

                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="esc_endereco" className={styles.label}>
                    <MapPin size={14} /> Endereço <span className={styles.required}>*</span>
                  </label>
                  <input type="text" id="esc_endereco" name="esc_endereco" className={styles.input}
                    placeholder="Ex: Av. Paulista, 1000, São Paulo - SP"
                    value={formData.esc_endereco} onChange={handleChange} />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="esc_dominio" className={styles.label}>
                    <Mail size={14} /> Domínio de E-mail
                  </label>
                  <input type="text" id="esc_dominio" name="esc_dominio" className={styles.input}
                    placeholder="Ex: inova.edu.br"
                    value={formData.esc_dominio} onChange={handleChange} />
                  <span className={styles.fieldHint}>Restringe cadastros ao domínio informado</span>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="esc_max_usuarios" className={styles.label}>
                    <Users size={14} /> Limite de Usuários
                  </label>
                  <input type="number" id="esc_max_usuarios" name="esc_max_usuarios" className={styles.input}
                    placeholder="Ex: 200"
                    value={formData.esc_max_usuarios} onChange={handleChange} min="1" />
                  <span className={styles.fieldHint}>Deixe vazio para sem limite</span>
                </div>
              </div>

              {stepError && <p className={styles.inlineError} style={{ marginTop: 16 }}>{stepError}</p>}

              <div className={styles.formActions}>
                <button type="button" className={styles.submitBtn} onClick={handleNextStep}>
                  Próximo <ChevronRight size={16} />
                </button>
                <button type="button" className={styles.cancelBtn} onClick={handleReset}>Limpar</button>
              </div>
            </>
          )}

          {/* ── Etapa 2 ─────────────────────────────────────────────────── */}
          {step === 2 && (
            <>
              <div className={styles.sectionHeader}>
                <UserPlus size={18} />
                <span>Cadastrar Administrador</span>
              </div>
              <p className={styles.sectionDescription}>Preencha os dados do administrador responsável pela instituição.</p>

              <div className={styles.formGrid}>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="usu_nome" className={styles.label}>
                    Nome Completo <span className={styles.required}>*</span>
                  </label>
                  <input type="text" id="usu_nome" name="usu_nome" className={styles.input}
                    placeholder="Ex: João Silva Santos"
                    value={adminData.usu_nome} onChange={handleAdminChange} />
                </div>

                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="usu_email" className={styles.label}>
                    <Mail size={14} /> E-mail <span className={styles.required}>*</span>
                  </label>
                  <input type="email" id="usu_email" name="usu_email" className={styles.input}
                    placeholder="Ex: admin@faculdade.edu.br"
                    value={adminData.usu_email} onChange={handleAdminChange} />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="usu_telefone" className={styles.label}>Telefone</label>
                  <input type="tel" id="usu_telefone" name="usu_telefone" className={styles.input}
                    placeholder="Ex: 11999990000"
                    value={adminData.usu_telefone} onChange={handleAdminChange} />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="usu_senha" className={styles.label}>
                    Senha <span className={styles.required}>*</span>
                  </label>
                  <input type="password" id="usu_senha" name="usu_senha" className={styles.input}
                    placeholder="Digite uma senha segura"
                    value={adminData.usu_senha} onChange={handleAdminChange} />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="usu_confirmSenha" className={styles.label}>
                    Confirmar Senha <span className={styles.required}>*</span>
                  </label>
                  <input type="password" id="usu_confirmSenha" name="usu_confirmSenha" className={styles.input}
                    placeholder="Confirme a senha"
                    value={adminData.usu_confirmSenha} onChange={handleAdminChange} />
                </div>
              </div>

              {stepError && <p className={styles.inlineError} style={{ marginTop: 16 }}>{stepError}</p>}

              <div className={styles.formActions}>
                <button type="button" className={styles.submitBtn} onClick={handleNextStep}>
                  Próximo <ChevronRight size={16} />
                </button>
                <button type="button" className={styles.cancelBtn} onClick={handlePrevStep}>
                  <ChevronLeft size={16} /> Voltar
                </button>
              </div>
            </>
          )}

          {/* ── Etapa 3: Cursos ─────────────────────────────────────────── */}
          {step === 3 && (
            <>
              <div className={styles.sectionHeader}>
                <BookOpen size={18} />
                <span>{editingCourseId ? 'Editar Curso' : 'Cadastrar Cursos'}</span>
              </div>
              <p className={styles.sectionDescription}>
                Adicione os cursos oferecidos pela instituição (opcional). Você pode editar ou remover antes de finalizar.
              </p>

              <div className={styles.formGrid}>
                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="cur_nome" className={styles.label}>Nome do Curso</label>
                  <input type="text" id="cur_nome" name="cur_nome" className={styles.input}
                    placeholder="Ex: Análise e Desenvolvimento de Sistemas"
                    value={newCourse.cur_nome} onChange={handleCourseChange} />
                </div>

                {/* <div className={styles.formGroup}>
                  <label htmlFor="cur_codigo" className={styles.label}>Código</label>
                  <input type="text" id="cur_codigo" name="cur_codigo" className={styles.input}
                    placeholder="Ex: ADS-001"
                    value={newCourse.cur_codigo} onChange={handleCourseChange} />
                </div> */}

                <div className={styles.formGroup}>
                  <label htmlFor="cur_semestres" className={styles.label}>
                    Módulos / Semestres
                  </label>
                  <input type="number" id="cur_semestres" name="cur_semestres" className={styles.input}
                    placeholder="Ex: 5"
                    value={newCourse.cur_semestres} onChange={handleCourseChange} min="1" />
                  <span className={styles.fieldHint}>Quantidade de períodos do curso</span>
                </div>

                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="cur_descricao" className={styles.label}>Descrição</label>
                  <input type="text" id="cur_descricao" name="cur_descricao" className={styles.input}
                    placeholder="Ex: Formação em desenvolvimento de sistemas"
                    value={newCourse.cur_descricao} onChange={handleCourseChange} />
                </div>
              </div>

              <div className={styles.courseFormActions}>
                {showCourseBtn && (
                  <button type="button" className={styles.addAdminBtn} onClick={handleAddCourse}>
                    {editingCourseId ? <><Pencil size={14} /> Salvar Alterações</> : <><Plus size={14} /> Adicionar Curso</>}
                  </button>
                )}
                {editingCourseId && (
                  <button type="button" className={styles.cancelEditBtn} onClick={handleCancelCourseEdit}>
                    <X size={14} /> Cancelar Edição
                  </button>
                )}
              </div>

              {stepError && <p className={styles.inlineError}>{stepError}</p>}

              {coursesList.length > 0 && (
                <div className={styles.adminList}>
                  <p className={styles.adminListLabel}>Cursos a cadastrar ({coursesList.length})</p>
                  {coursesList.map(course => (
                    <div key={course.cur_id}
                      className={`${styles.adminTag} ${editingCourseId === course.cur_id ? styles.adminTagEditing : ''}`}>
                      <div className={styles.courseTagInfo}>
                        <span className={styles.adminTagName}>{course.cur_nome}</span>
                        {/* <span className={styles.adminTagEmail}>{course.cur_codigo}</span> */}
                        {course.cur_semestres && (
                          <span className={styles.semestresBadge}>{course.cur_semestres} sem.</span>
                        )}
                      </div>
                      <div className={styles.courseTagActions}>
                        <button type="button" className={styles.editCourseBtn}
                          onClick={() => handleEditCourse(course)} title="Editar curso">
                          <Pencil size={13} />
                        </button>
                        <button type="button" className={styles.removeAdminBtn}
                          onClick={() => handleRemoveCourse(course.cur_id)} title="Remover">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {submitSuccess && (
                <div className={styles.alertSuccess}>
                  <CheckCircle size={16} /> {submitSuccess}
                </div>
              )}
              {submitError && (
                <div className={styles.alertError}>
                  <AlertCircle size={16} /> {submitError}
                </div>
              )}

              <div className={styles.formActions}>
                <button type="submit" className={styles.submitBtn} disabled={submitLoading}>
                  {submitLoading
                    ? <><Loader2 size={16} className={styles.spin} /> Cadastrando...</>
                    : 'Cadastrar Instituição'}
                </button>
                <button type="button" className={styles.cancelBtn} onClick={handlePrevStep}>
                  <ChevronLeft size={16} /> Voltar
                </button>
              </div>
            </>
          )}
        </form>
      </div>

      {/* ── Lista de Instituições ──────────────────────────────────────────── */}
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
            <AlertCircle size={16} /> {listError}
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
            {institutions.map(inst => {
              const escId = inst.esc_id ?? inst.id;
              const isExpanded = expandedInstitution === escId;
              const courses = institutionCourses[escId] || [];
              const isLoadingCourses = instCourseLoading[escId];
              const action = instCourseAction?.escId === escId ? instCourseAction : null;

              return (
                <div key={escId} className={styles.institutionCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.institutionInfo}>
                      <h3 className={styles.institutionName}>{inst.esc_nome}</h3>
                      <p className={styles.institutionAddress}>
                        <MapPin size={12} /> {inst.esc_endereco}
                      </p>
                    </div>
                    <button className={styles.iconBtn}
                      onClick={() => handleDeleteInstitution(escId)} title="Remover instituição">
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

                  {/* Toggle de cursos */}
                  <button className={styles.coursesToggleBtn} onClick={() => handleToggleInstitution(escId)}>
                    <BookOpen size={13} />
                    <span>Cursos{isExpanded && courses.length > 0 ? ` (${courses.length})` : ''}</span>
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>

                  {/* Seção de cursos expandida */}
                  {isExpanded && (
                    <div className={styles.coursesSection}>
                      {isLoadingCourses && (
                        <div className={styles.coursesLoading}>
                          <Loader2 size={14} className={styles.spin} /> Carregando cursos...
                        </div>
                      )}

                      {!isLoadingCourses && courses.length === 0 && !action && (
                        <p className={styles.noCoursesMsg}>Nenhum curso cadastrado para esta instituição.</p>
                      )}

                      {!isLoadingCourses && courses.map(course => (
                        <div key={course.cur_id} className={styles.courseItem}>
                          <div className={styles.courseItemInfo}>
                            <span className={styles.courseItemName}>{course.cur_nome}</span>
                            <div className={styles.courseItemMeta}>
                              {/* <span className={styles.courseItemCode}>{course.cur_codigo}</span> */}
                              {course.cur_semestres != null && (
                                <span className={styles.courseItemSemesters}>{course.cur_semestres} semestres</span>
                              )}
                            </div>
                            {course.cur_descricao && (
                              <span className={styles.courseItemDesc}>{course.cur_descricao}</span>
                            )}
                          </div>
                          <div className={styles.courseItemActions}>
                            <button className={styles.iconBtnSmall}
                              onClick={() => handleStartEditInstCourse(escId, course)} title="Editar curso">
                              <Pencil size={12} />
                            </button>
                            <button className={`${styles.iconBtnSmall} ${styles.iconBtnDanger}`}
                              onClick={() => handleDeleteInstCourse(escId, course.cur_id)} title="Remover curso">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Formulário de adição/edição de curso */}
                      {action && (
                        <div className={styles.courseEditForm}>
                          <p className={styles.courseEditFormTitle}>
                            {action.type === 'add' ? 'Novo curso' : 'Editar curso'}
                          </p>
                          <div className={styles.courseEditGrid}>
                            <div style={{ gridColumn: '1 / -1' }}>
                              <label className={styles.label}>Nome do Curso <span className={styles.required}>*</span></label>
                              <input type="text" name="cur_nome" className={styles.input}
                                placeholder="Ex: Análise e Desenvolvimento de Sistemas"
                                value={instCourseForm.cur_nome} onChange={handleInstCourseFormChange} />
                            </div>
                            {/* <div>
                              <label className={styles.label}>Código <span className={styles.required}>*</span></label>
                              <input type="text" name="cur_codigo" className={styles.input}
                                placeholder="Ex: ADS-001"
                                value={instCourseForm.cur_codigo} onChange={handleInstCourseFormChange} />
                            </div> */}
                            <div>
                              <label className={styles.label}>Semestres / Módulos</label>
                              <input type="number" name="cur_semestres" className={styles.input}
                                placeholder="Ex: 5"
                                value={instCourseForm.cur_semestres} onChange={handleInstCourseFormChange} min="1" />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                              <label className={styles.label}>Descrição</label>
                              <input type="text" name="cur_descricao" className={styles.input}
                                placeholder="Ex: Formação em desenvolvimento de sistemas"
                                value={instCourseForm.cur_descricao} onChange={handleInstCourseFormChange} />
                            </div>
                          </div>
                          {instCourseError && <p className={styles.inlineError}>{instCourseError}</p>}
                          <div className={styles.courseEditActions}>
                            <button type="button" className={styles.saveInstCourseBtn}
                              onClick={handleSaveInstCourse}>
                              <CheckCircle size={13} />
                              {action.type === 'add' ? 'Adicionar' : 'Salvar'}
                            </button>
                            <button type="button" className={styles.cancelEditBtn}
                              onClick={handleCancelInstCourseAction}>
                              <X size={13} /> Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                      {!action && (
                        <button className={styles.addCourseBtn}
                          onClick={() => handleStartAddInstCourse(escId)}>
                          <Plus size={13} /> Adicionar Curso
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
