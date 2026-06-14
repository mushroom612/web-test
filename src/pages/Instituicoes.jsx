// ============================================================
// pages/Instituicoes.jsx — Gerenciamento de instituições
//
// Lista todas as instituições cadastradas com opções para
// editar cursos e criar nova instituição.
//
// Funcionalidades:
//   - Exibição de todas as instituições
//   - Expansão de instituição para gerenciar cursos
//   - Criar, editar e remover cursos por instituição
//   - Botão para cadastrar nova instituição
//
// Estilo: CadastroInstituicoes.module.css
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  IconBuilding, IconMapPin, IconMail, IconUsers, IconTrash,
  IconBook, IconPencil, IconPlus, IconChevronDown, IconChevronUp,
  IconCircleCheck, IconAlertCircle, IconLoader2, IconX
} from '@tabler/icons-react';
import { api } from '../services/api';
import { EmptyState } from '../components/EmptyState';
import styles from './CadastroInstituicoes.module.css';

const EMPTY_COURSE = { cur_nome: '', cur_descricao: '', cur_semestres: '' };

export function Instituicoes() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [institutions, setInstitutions]   = useState([]);
  const [listLoading, setListLoading]     = useState(true);
  const [listError, setListError]         = useState('');
  const [successMsg, setSuccessMsg]       = useState(location.state?.success || '');

  // ── Gerenciamento de cursos por instituição ──────────────────
  const [expandedInstitution, setExpandedInstitution]   = useState(null);
  const [institutionCourses, setInstitutionCourses]     = useState({});
  const [instCourseLoading, setInstCourseLoading]       = useState({});
  const [instCourseAction, setInstCourseAction]         = useState(null);
  const [instCourseForm, setInstCourseForm]             = useState(EMPTY_COURSE);
  const [instCourseError, setInstCourseError]           = useState('');

  useEffect(() => { loadInstitutions(); }, []);

  // Limpa o state de navegação para não reexibir a mensagem após F5
  useEffect(() => {
    if (location.state?.success) {
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  async function loadInstitutions() {
    setListLoading(true);
    setListError('');
    try {
      const data = await api.getSchools();
      setInstitutions(data?.escolas ?? (Array.isArray(data) ? data : []));
    } catch (err) {
      setListError(err.message || 'Não foi possível carregar as instituições.');
    } finally {
      setListLoading(false);
    }
  }

  async function loadInstCourses(escId) {
    setInstCourseLoading(prev => ({ ...prev, [escId]: true }));
    try {
      const data = await api.getCourses(escId);
      const lista = data?.cursos ?? (Array.isArray(data) ? data : []);
      setInstitutionCourses(prev => ({ ...prev, [escId]: lista }));
    } catch {
      setInstitutionCourses(prev => ({ ...prev, [escId]: [] }));
    } finally {
      setInstCourseLoading(prev => ({ ...prev, [escId]: false }));
    }
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
    if (!institutionCourses[escId]) loadInstCourses(escId);
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
      cur_semestres: course.cur_semestre != null ? String(course.cur_semestre) : ''
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
      cur_nome:      instCourseForm.cur_nome,
      cur_descricao: instCourseForm.cur_descricao || null,
      cur_semestres: instCourseForm.cur_semestres ? parseInt(instCourseForm.cur_semestres) : null
    };
    try {
      if (type === 'add') {
        const res = await api.createCourse({ ...payload, esc_id: escId });
        const novoCurso = res?.curso ?? res;
        setInstitutionCourses(prev => ({ ...prev, [escId]: [...(prev[escId] || []), novoCurso] }));
      } else {
        await api.updateCourse(course.cur_id, payload);
        const cursoAtualizado = {
          ...course,
          cur_nome: payload.cur_nome,
          cur_descricao: payload.cur_descricao,
          cur_semestre: payload.cur_semestres ?? course.cur_semestre
        };
        setInstitutionCourses(prev => ({
          ...prev,
          [escId]: prev[escId].map(c => c.cur_id === course.cur_id ? cursoAtualizado : c)
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Instituições</h1>
          <p className={styles.subtitle}>Gerencie as instituições parceiras da plataforma TucTuc</p>
        </div>
        <button
          type="button"
          className={styles.submitBtn}
          onClick={() => navigate('/cadastrar/novo')}
        >
          <IconPlus size={15} /> Nova Instituição
        </button>
      </div>

      {successMsg && (
        <div className={styles.alertSuccess} style={{ marginBottom: 20 }}>
          <IconCircleCheck size={16} /> {successMsg}
          <button
            type="button"
            onClick={() => setSuccessMsg('')}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 2 }}
          >
            <IconX size={14} />
          </button>
        </div>
      )}

      {listLoading && (
        <div className={styles.loadingState}>
          <IconLoader2 size={24} className={styles.spin} />
          <span>Carregando instituições...</span>
        </div>
      )}

      {listError && !listLoading && (
        <div className={styles.alertError}>
          <IconAlertCircle size={16} /> {listError}
        </div>
      )}

      {!listLoading && !listError && institutions.length === 0 && (
        <EmptyState
          icon={IconBuilding}
          title="Nenhuma instituição cadastrada ainda."
          action={{ label: 'Cadastrar primeira instituição', onClick: () => navigate('/cadastrar/novo') }}
        />
      )}

      {!listLoading && institutions.length > 0 && (
        <div className={styles.institutionsList}>
          {institutions.map(inst => {
            const escId          = inst.esc_id ?? inst.id;
            const isExpanded     = expandedInstitution === escId;
            const courses        = institutionCourses[escId] || [];
            const isLoadingCourses = instCourseLoading[escId];
            const action         = instCourseAction?.escId === escId ? instCourseAction : null;

            return (
              <div key={escId} className={styles.institutionCard}>
                {/* Cabeçalho */}
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <h3 className={styles.institutionName}>{inst.esc_nome}</h3>
                    {inst.esc_endereco && (
                      <p className={styles.institutionAddress}>
                        <IconMapPin size={11} /> {inst.esc_endereco}
                      </p>
                    )}
                  </div>
                  <button className={styles.iconBtn}
                    onClick={() => handleDeleteInstitution(escId)} title="Remover instituição">
                    <IconTrash size={15} />
                  </button>
                </div>

                {/* Grade de informações */}
                <div className={styles.cardInfo}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Domínio</span>
                    <span className={styles.infoValue}>
                      {inst.esc_dominio
                        ? <><IconMail size={11} /> {inst.esc_dominio}</>
                        : <span style={{ color: 'var(--text-secondary)' }}>Sem restrição</span>}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Limite de Usuários</span>
                    <span className={styles.infoValue}>
                      {inst.esc_max_usuarios
                        ? <><IconUsers size={11} /> {inst.esc_max_usuarios} usuários</>
                        : <span style={{ color: 'var(--text-secondary)' }}>Sem limite</span>}
                    </span>
                  </div>
                </div>

                {/* Botão de expandir cursos */}
                <button className={styles.coursesToggleBtn} onClick={() => handleToggleInstitution(escId)}>
                  <IconBook size={13} />
                  <span>
                    {isExpanded && courses.length > 0
                      ? `Cursos (${courses.length})`
                      : 'Cursos'}
                  </span>
                  {isExpanded ? <IconChevronUp size={13} /> : <IconChevronDown size={13} />}
                </button>

                {isExpanded && (
                  <div className={styles.coursesSection}>
                    {isLoadingCourses && (
                      <div className={styles.coursesLoading}>
                        <IconLoader2 size={14} className={styles.spin} /> Carregando...
                      </div>
                    )}

                    {!isLoadingCourses && courses.length === 0 && !action && (
                      <p className={styles.noCoursesMsg}>Nenhum curso cadastrado.</p>
                    )}

                    {!isLoadingCourses && courses.map(course => (
                      <div key={course.cur_id} className={styles.courseItem}>
                        <div className={styles.courseItemInfo}>
                          <span className={styles.courseItemName}>{course.cur_nome}</span>
                          <div className={styles.courseItemMeta}>
                            {course.cur_semestre != null && (
                              <span className={styles.courseItemSemesters}>{course.cur_semestre} sem.</span>
                            )}
                          </div>
                          {course.cur_descricao && (
                            <span className={styles.courseItemDesc}>{course.cur_descricao}</span>
                          )}
                        </div>
                        <div className={styles.courseItemActions}>
                          <button className={styles.editCourseBtn}
                            onClick={() => handleStartEditInstCourse(escId, course)} title="Editar">
                            <IconPencil size={13} />
                          </button>
                          <button className={styles.removeAdminBtn}
                            onClick={() => handleDeleteInstCourse(escId, course.cur_id)} title="Remover">
                            <IconX size={13} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {action && (
                      <div className={styles.courseEditForm}>
                        <div className={styles.courseEditGrid}>
                          <div>
                            <label className={styles.label}>Nome do Curso <span className={styles.required}>*</span></label>
                            <input type="text" name="cur_nome" className={styles.input}
                              placeholder="Ex: Análise e Desenvolvimento de Sistemas"
                              value={instCourseForm.cur_nome} onChange={handleInstCourseFormChange} />
                          </div>
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
                            <IconCircleCheck size={13} />
                            {action.type === 'add' ? 'Adicionar' : 'Salvar'}
                          </button>
                          <button type="button" className={styles.cancelEditBtn}
                            onClick={handleCancelInstCourseAction}>
                            <IconX size={13} /> Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {!action && (
                      <button className={styles.addCourseBtn}
                        onClick={() => handleStartAddInstCourse(escId)}>
                        <IconPlus size={13} /> Adicionar Curso
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
  );
}
