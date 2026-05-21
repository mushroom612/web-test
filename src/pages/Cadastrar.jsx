// ============================================================
// pages/Cadastrar.jsx — Página de cadastro de instituições
//
// Formulário em múltiplas etapas (wizard) para cadastrar
// uma nova instituição parceira na plataforma, junto com
// seu administrador e cursos.
//
// Fluxo em 4 etapas:
//   Etapa 1 → Dados da Escola (nome, endereço, domínio, limite)
//   Etapa 2 → Contrato (duração, data de início, upload de arquivo)
//   Etapa 3 → Administrador (nome, e-mail, telefone, senha)
//   Etapa 4 → Cursos (adicionar/editar/remover antes de finalizar)
//
// Além do formulário, a página exibe a lista de instituições
// já cadastradas com gerenciamento de cursos por instituição.
//
// Bibliotecas usadas:
//   - react         → useState, useEffect
//   - lucide-react  → ícones variados por seção
//
// Estilo: Cadastrar.module.css
//   Classes principais:
//     .container           → área da página
//     .header              → cabeçalho
//     .formCard            → card branco do formulário
//     .stepIndicator       → linha de progresso das etapas
//     .stepItem / .stepActive  → cada etapa e seu estado ativo
//     .stepLine / .stepLineDone → linha entre etapas e estado completo
//     .stepCircle / .stepLabel  → número e texto de cada etapa
//     .sectionHeader       → cabeçalho de seção dentro do form
//     .formGrid            → grid de campos do formulário
//     .formGroup           → wrapper de label + input
//     .label               → rótulo do campo
//     .input               → campo de entrada (input, select, textarea)
//     .required            → asterisco de campo obrigatório
//     .fieldHint           → texto de ajuda abaixo do campo
//     .inlineError         → mensagem de erro dentro da etapa
//     .formActions         → botões de navegação entre etapas
//     .submitBtn           → botão principal (Próximo / Cadastrar)
//     .cancelBtn           → botão secundário (Voltar / Limpar)
//     .fileUploadZone      → área de drag-and-drop para upload de arquivo
//     .fileSelected        → exibição do arquivo selecionado
//     .alertSuccess / .alertError → banners de feedback de resultado
//     .adminList / .adminTag → lista e tag de cursos na etapa 4
//     .courseTagActions / .editCourseBtn / .removeAdminBtn → ações do curso
//     .courseFormActions / .addAdminBtn → botão de adicionar curso
//     .cancelEditBtn       → cancelar edição de curso
//     .institutionsSection → seção de lista de instituições
//     .institutionsList / .institutionCard → lista e cada card
//     .cardHeader / .institutionInfo → cabeçalho do card de instituição
//     .cardContent / .institutionDetails / .detailItem → detalhes do card
//     .iconBtn             → botão ícone (deletar)
//     .coursesToggleBtn    → botão de expandir cursos da instituição
//     .coursesSection      → seção de cursos expandida
//     .courseItem / .courseItemInfo / .courseItemActions → item de curso
//     .courseEditForm / .courseEditGrid / .courseEditActions → form inline
//     .loadingState / .emptyState → estados de carregamento e vazio
//     .spin                → animação de rotação do Loader2
// ============================================================

import { useState, useEffect } from 'react';
import {
  Building2, MapPin, Mail, Users, Trash2,
  UserPlus, X, CheckCircle, AlertCircle, Loader2,
  ChevronRight, ChevronLeft, BookOpen, Pencil, Plus, ChevronDown, ChevronUp,
  FileText, CalendarDays
} from 'lucide-react';
import { api } from '../services/api';
import styles from './Cadastrar.module.css';

// EMPTY_COURSE: objeto padrão para um novo curso (campos vazios).
// Usado para resetar o formulário de curso após adicionar ou cancelar.
const EMPTY_COURSE = { cur_nome: '', cur_descricao: '', cur_semestres: '' };

// calcExpiry: calcula a data de vencimento do contrato a partir da
// data de início e da duração escolhida (1, 2 ou 5 anos).
// Retorna uma string no formato ISO "YYYY-MM-DD".
function calcExpiry(inicio, duracao) {
  if (!inicio || !duracao) return null;
  const [y, m, d] = inicio.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (duracao === '1ano') date.setFullYear(date.getFullYear() + 1);
  else if (duracao === '2anos') date.setFullYear(date.getFullYear() + 2);
  else if (duracao === '5anos') date.setFullYear(date.getFullYear() + 5);
  return date.toISOString().split('T')[0];
}

// formatDateStr: converte "YYYY-MM-DD" para o formato brasileiro "DD/MM/AAAA"
function formatDateStr(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
}

export function Cadastrar() {
  // step: etapa atual do formulário (1 a 4)
  const [step, setStep] = useState(1);
  // stepError: mensagem de erro dentro da etapa atual
  const [stepError, setStepError] = useState('');

  // formData: dados da escola (etapas 1 e 2)
  const [formData, setFormData] = useState({
    esc_nome: '',
    esc_endereco: '',
    esc_dominio: '',
    esc_max_usuarios: '',
    esc_contrato_duracao: '',
    esc_contrato_inicio: ''
  });

  // adminData: dados do administrador da instituição (etapa 3)
  const [adminData, setAdminData] = useState({
    usu_nome: '',
    usu_email: '',
    usu_telefone: '',
    usu_senha: '',
    usu_confirmSenha: ''
  });

  // ── Cursos (etapa 4 - pré-cadastro) ────────────────────────
  const [coursesList, setCoursesList] = useState([]);    // cursos a cadastrar
  const [newCourse, setNewCourse] = useState(EMPTY_COURSE); // form de novo curso
  const [editingCourseId, setEditingCourseId] = useState(null); // ID do curso em edição

  // ── Contrato (etapa 2) ──────────────────────────────────────
  // contractFile: arquivo PDF/DOC selecionado pelo usuário
  const [contractFile, setContractFile] = useState(null);

  // ── Feedback de submit ──────────────────────────────────────
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  // ── Lista de instituições já cadastradas ────────────────────
  const [institutions, setInstitutions] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  // ── Gerenciamento de cursos por instituição (lista inferior) ──
  // expandedInstitution: ID da instituição com cursos expandidos
  const [expandedInstitution, setExpandedInstitution] = useState(null);
  // institutionCourses: objeto { escId: [cursos] } para cache local
  const [institutionCourses, setInstitutionCourses] = useState({});
  // instCourseLoading: { escId: true/false } — spinner por instituição
  const [instCourseLoading, setInstCourseLoading] = useState({});
  // instCourseAction: { type: 'add'|'edit', escId, course? } — ação ativa
  const [instCourseAction, setInstCourseAction] = useState(null);
  const [instCourseForm, setInstCourseForm] = useState(EMPTY_COURSE);
  const [instCourseError, setInstCourseError] = useState('');

  // Carrega as instituições ao montar o componente
  useEffect(() => { loadInstitutions(); }, []);

  async function loadInstitutions() {
    setListLoading(true);
    setListError('');
    try {
      const data = await api.getSchools();
      // Array.isArray: verifica se é um array direto ou objeto com .escolas
      setInstitutions(Array.isArray(data) ? data : data.escolas ?? []);
    } catch (err) {
      setListError(err.message || 'Não foi possível carregar as instituições.');
    } finally {
      setListLoading(false);
    }
  }

  // Carrega os cursos de uma instituição específica (lazy loading)
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

  // ── Handlers de campos do formulário ───────────────────────

  // Atualiza o formData quando qualquer campo da escola é alterado.
  // e.target.name → atributo "name" do input (ex: "esc_nome")
  // e.target.value → valor digitado
  // O spread ...prev mantém os outros campos intactos.
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

  // ── Gerenciamento de cursos na etapa 4 ─────────────────────

  // Adiciona ou salva a edição de um curso na lista local
  function handleAddCourse() {
    if (!newCourse.cur_nome.trim()) {
      setStepError('Preencha o nome do curso.');
      return;
    }
    if (editingCourseId !== null) {
      // Modo edição: substitui o curso pelo atualizado
      setCoursesList(prev =>
        prev.map(c => c.cur_id === editingCourseId ? { ...newCourse, cur_id: editingCourseId } : c)
      );
      setEditingCourseId(null);
    } else {
      // Modo adição: insere o novo curso com ID único baseado no timestamp
      setCoursesList(prev => [...prev, { ...newCourse, cur_id: Date.now() }]);
    }
    setNewCourse(EMPTY_COURSE);
    setStepError('');
  }

  // Preenche o formulário com os dados do curso para editar
  function handleEditCourse(course) {
    setEditingCourseId(course.cur_id);
    setNewCourse({
      cur_nome: course.cur_nome,
      cur_descricao: course.cur_descricao || '',
      // != null cobre tanto null quanto undefined (diferente de !== null)
      cur_semestres: course.cur_semestres != null ? String(course.cur_semestres) : ''
    });
    setStepError('');
  }

  function handleCancelCourseEdit() {
    setEditingCourseId(null);
    setNewCourse(EMPTY_COURSE);
    setStepError('');
  }

  // Remove um curso da lista local pelo ID
  function handleRemoveCourse(courseId) {
    setCoursesList(prev => prev.filter(c => c.cur_id !== courseId));
    if (editingCourseId === courseId) {
      setEditingCourseId(null);
      setNewCourse(EMPTY_COURSE);
    }
  }

  // ── Navegação entre etapas ──────────────────────────────────

  // Valida os campos obrigatórios antes de avançar para a próxima etapa
  function handleNextStep() {
    setStepError('');
    if (step === 1) {
      if (!formData.esc_nome.trim() || !formData.esc_endereco.trim()) {
        setStepError('Preencha os campos obrigatórios antes de continuar.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (formData.esc_contrato_duracao && !formData.esc_contrato_inicio) {
        setStepError('Informe a data de início do contrato.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!adminData.usu_nome.trim() || !adminData.usu_email.trim() || !adminData.usu_senha.trim()) {
        setStepError('Preencha os campos obrigatórios do administrador.');
        return;
      }
      if (adminData.usu_senha !== adminData.usu_confirmSenha) {
        setStepError('As senhas não coincidem.');
        return;
      }
      setStep(4);
    }
  }

  function handlePrevStep() {
    setStepError('');
    setStep(step > 1 ? step - 1 : 1);
  }

  // ── Submit final (etapa 4) ──────────────────────────────────

  // Executa sequencialmente:
  // 1. Cria o usuário admin
  // 2. Cria a escola vinculada ao admin
  // 3. Cria os cursos vinculados à escola
  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setSubmitLoading(true);

    try {
      // Passo 1: criar o admin da instituição
      const adminPayload = {
        usu_nome: adminData.usu_nome,
        usu_email: adminData.usu_email,
        usu_telefone: adminData.usu_telefone || null,
        per_tipo: 1 // 1 = Administrador de escola
      };
      const createdAdmin = await api.createUser(adminPayload);
      const newAdminId = createdAdmin.usuario?.usu_id;

      // Passo 2: criar a escola.
      // O spread condicional (...(cond ? { campo: valor } : {}))
      // só inclui o campo se ele tiver valor preenchido.
      const schoolPayload = {
        esc_nome: formData.esc_nome,
        esc_endereco: formData.esc_endereco,
        ...(formData.esc_dominio ? { esc_dominio: formData.esc_dominio } : {}),
        ...(formData.esc_max_usuarios ? { esc_max_usuarios: parseInt(formData.esc_max_usuarios) } : {}),
        ...(formData.esc_contrato_duracao && formData.esc_contrato_inicio ? {
          esc_contrato_duracao: formData.esc_contrato_duracao,
          esc_contrato_inicio: formData.esc_contrato_inicio,
          esc_contrato_expira: calcExpiry(formData.esc_contrato_inicio, formData.esc_contrato_duracao)
        } : {
          esc_contrato_duracao: null,
          esc_contrato_inicio: null,
          esc_contrato_expira: null
        })
      };
      const createdSchool = await api.createSchool(schoolPayload);
      const escId = createdSchool.escola?.esc_id || createdSchool.esc_id;

      // Vincula o admin à escola criada
      await api.updateUserProfile(newAdminId, { per_tipo: 1, per_escola_id: escId });

      // Passo 3: criar os cursos em sequência (for...of espera cada um)
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
      loadInstitutions(); // recarrega a lista de instituições
    } catch (err) {
      setSubmitError(err.message || 'Erro ao cadastrar instituição.');
    } finally {
      setSubmitLoading(false);
    }
  }

  // Reseta todos os estados do formulário para os valores iniciais
  function handleReset() {
    setStep(1);
    setStepError('');
    setFormData({ esc_nome: '', esc_endereco: '', esc_dominio: '', esc_max_usuarios: '', esc_contrato_duracao: '', esc_contrato_inicio: '' });
    setAdminData({ usu_nome: '', usu_email: '', usu_telefone: '', usu_senha: '', usu_confirmSenha: '' });
    setCoursesList([]);
    setNewCourse(EMPTY_COURSE);
    setEditingCourseId(null);
    setContractFile(null);
    setSubmitError('');
    setSubmitSuccess('');
  }

  // Remove uma instituição da lista após confirmação
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

  // ── Gerenciamento de cursos por instituição (lista inferior) ─

  // Toggle: expande ou colapsa os cursos de uma instituição.
  // Lazy loading: só busca os cursos quando expandido pela primeira vez.
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
    // Só carrega se ainda não tem os dados em cache
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

  // Salva adição ou edição de curso em uma instituição existente
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
        // Adiciona o novo curso ao cache local da instituição
        setInstitutionCourses(prev => ({ ...prev, [escId]: [...(prev[escId] || []), created] }));
      } else {
        const updated = await api.updateCourse(course.cur_id, payload);
        // Substitui o curso editado no cache local
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

  // Remove um curso de uma instituição e atualiza o cache local
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

  // showCourseBtn: controla se o botão "Adicionar Curso" aparece.
  // Só exibe quando o usuário já digitou algo no formulário de curso.
  const showCourseBtn = editingCourseId !== null || newCourse.cur_nome.trim() || newCourse.cur_descricao.trim() || newCourse.cur_semestres.trim();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Cadastrar Instituição</h1>
        <p className={styles.subtitle}>Adicione uma nova instituição e defina seus administradores</p>
      </div>

      {/* Card principal com o formulário em etapas */}
      <div className={styles.formCard}>
        {/* Indicador visual de progresso (barra de etapas) */}
        <div className={styles.stepIndicator}>
          <div className={`${styles.stepItem} ${step >= 1 ? styles.stepActive : ''}`}>
            <div className={styles.stepCircle}>1</div>
            <span className={styles.stepLabel}>Dados da Escola</span>
          </div>
          {/* stepLineDone: a linha fica colorida quando a etapa seguinte foi atingida */}
          <div className={`${styles.stepLine} ${step >= 2 ? styles.stepLineDone : ''}`} />
          <div className={`${styles.stepItem} ${step >= 2 ? styles.stepActive : ''}`}>
            <div className={styles.stepCircle}>2</div>
            <span className={styles.stepLabel}>Contrato</span>
          </div>
          <div className={`${styles.stepLine} ${step >= 3 ? styles.stepLineDone : ''}`} />
          <div className={`${styles.stepItem} ${step >= 3 ? styles.stepActive : ''}`}>
            <div className={styles.stepCircle}>3</div>
            <span className={styles.stepLabel}>Administrador</span>
          </div>
          <div className={`${styles.stepLine} ${step >= 4 ? styles.stepLineDone : ''}`} />
          <div className={`${styles.stepItem} ${step >= 4 ? styles.stepActive : ''}`}>
            <div className={styles.stepCircle}>4</div>
            <span className={styles.stepLabel}>Cursos</span>
          </div>
        </div>

        {/* O form envolve todas as etapas.
            onSubmit só é chamado na etapa 4 (type="submit" botão). */}
        <form onSubmit={handleSubmit}>

          {/* ── Etapa 1: Dados da Escola ─────────────────────────── */}
          {/* step === 1 é a condição de renderização condicional:
              só exibe este bloco quando estamos na etapa 1. */}
          {step === 1 && (
            <>
              <div className={styles.sectionHeader}>
                <Building2 size={18} />
                <span>Dados da Escola</span>
              </div>

              <div className={styles.formGrid}>
                {/* gridColumn: '1 / -1' faz o campo ocupar toda a largura do grid */}
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
                {/* type="button" evita que este botão submeta o form */}
                <button type="button" className={styles.submitBtn} onClick={handleNextStep}>
                  Próximo <ChevronRight size={16} />
                </button>
                <button type="button" className={styles.cancelBtn} onClick={handleReset}>Limpar</button>
              </div>
            </>
          )}

          {/* ── Etapa 2: Contrato ─────────────────────────────────── */}
          {step === 2 && (
            <>
              <div className={styles.sectionHeader}>
                <FileText size={18} />
                <span>Contrato Institucional</span>
              </div>
              <p className={styles.sectionDescription}>
                Defina os dados do contrato e anexe o documento assinado (opcional). Tudo pode ser atualizado depois.
              </p>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="esc_contrato_duracao" className={styles.label}>
                    <FileText size={14} /> Duração do Contrato
                  </label>
                  {/* select: campo de seleção com opções fixas */}
                  <select
                    id="esc_contrato_duracao"
                    name="esc_contrato_duracao"
                    className={styles.input}
                    value={formData.esc_contrato_duracao}
                    onChange={handleChange}
                  >
                    <option value="">Sem contrato</option>
                    <option value="1ano">1 Ano</option>
                    <option value="2anos">2 Anos</option>
                    <option value="5anos">5 Anos</option>
                  </select>
                  <span className={styles.fieldHint}>Período de vigência do contrato com a plataforma</span>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="esc_contrato_inicio" className={styles.label}>
                    <CalendarDays size={14} /> Data de Início
                  </label>
                  <input
                    type="date"
                    id="esc_contrato_inicio"
                    name="esc_contrato_inicio"
                    className={styles.input}
                    value={formData.esc_contrato_inicio}
                    onChange={handleChange}
                    // Campo desabilitado até que uma duração seja escolhida
                    disabled={!formData.esc_contrato_duracao}
                  />
                  {/* Exibe a data de vencimento calculada se os dois campos estiverem preenchidos */}
                  {formData.esc_contrato_duracao && formData.esc_contrato_inicio && (
                    <span className={styles.fieldHint}>
                      Vencimento: {formatDateStr(calcExpiry(formData.esc_contrato_inicio, formData.esc_contrato_duracao))}
                    </span>
                  )}
                  {!formData.esc_contrato_duracao && (
                    <span className={styles.fieldHint}>Selecione a duração primeiro</span>
                  )}
                </div>
              </div>

              <hr className={styles.divider} />

              <div className={styles.sectionHeader} style={{ marginBottom: 12 }}>
                <FileText size={16} />
                <span style={{ fontSize: 14 }}>Documento do Contrato</span>
                <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-secondary)' }}>(opcional)</span>
              </div>

              {/* Área de upload: alterna entre zona de drop e arquivo selecionado */}
              {!contractFile ? (
                // fileUploadZone: <label> que age como botão de upload
                // O <input type="file"> dentro do label é ativado pelo clique na label
                <label className={styles.fileUploadZone} htmlFor="contractFileInput">
                  <input
                    type="file"
                    id="contractFileInput"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setContractFile(e.target.files[0] || null)}
                  />
                  <div className={styles.fileUploadIcon}>
                    <FileText size={32} />
                  </div>
                  <p className={styles.fileUploadText}>
                    <strong>Clique para selecionar</strong> o arquivo do contrato
                  </p>
                  <p className={styles.fileHint}>PDF, DOC ou DOCX — será enviado ao servidor ao integrar a API</p>
                </label>
              ) : (
                // Exibe o nome e tamanho do arquivo após selecionado
                <div className={styles.fileSelected}>
                  <FileText size={18} style={{ color: 'var(--btn-primary-bg)', flexShrink: 0 }} />
                  <span className={styles.fileSelectedName}>{contractFile.name}</span>
                  <span className={styles.fileSelectedSize}>
                    {/* Converte bytes para KB com 0 casas decimais */}
                    {(contractFile.size / 1024).toFixed(0)} KB
                  </span>
                  <button
                    type="button"
                    className={styles.fileRemoveBtn}
                    onClick={() => setContractFile(null)}
                    title="Remover arquivo"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}

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

          {/* ── Etapa 3: Administrador ─────────────────────────────── */}
          {step === 3 && (
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

          {/* ── Etapa 4: Cursos ────────────────────────────────────── */}
          {step === 4 && (
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

                <div className={styles.formGroup}>
                  <label htmlFor="cur_semestres" className={styles.label}>Módulos / Semestres</label>
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

              {/* showCourseBtn: botão só aparece quando o form tem conteúdo */}
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

              {/* Lista de cursos já adicionados (ainda não salvos) */}
              {coursesList.length > 0 && (
                <div className={styles.adminList}>
                  <p className={styles.adminListLabel}>Cursos a cadastrar ({coursesList.length})</p>
                  {coursesList.map(course => (
                    <div key={course.cur_id}
                      className={`${styles.adminTag} ${editingCourseId === course.cur_id ? styles.adminTagEditing : ''}`}>
                      <div className={styles.courseTagInfo}>
                        <span className={styles.adminTagName}>{course.cur_nome}</span>
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

              {/* Banners de feedback do submit final */}
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
                {/* type="submit" → este botão aciona o handleSubmit do form */}
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

      {/* ── Lista de Instituições Cadastradas ──────────────────────── */}
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
              // action: ação ativa para ESTA instituição (ou null se for outra)
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

                  {/* Botão de expandir/colapsar cursos da instituição */}
                  <button className={styles.coursesToggleBtn} onClick={() => handleToggleInstitution(escId)}>
                    <BookOpen size={13} />
                    <span>Cursos{isExpanded && courses.length > 0 ? ` (${courses.length})` : ''}</span>
                    {/* Ícone muda conforme o estado de expansão */}
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>

                  {/* Seção de cursos: só renderiza quando expandida */}
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

                      {/* Formulário inline de adição/edição de curso */}
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

                      {/* Botão de adicionar curso: só aparece quando não há ação ativa */}
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
