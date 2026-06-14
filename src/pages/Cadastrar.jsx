// ============================================================
// pages/Cadastrar.jsx — Cadastro de nova instituição
//
// Formulário multi-etapa para cadastrar uma nova instituição
// parceira na plataforma, incluindo:
//   1. Dados da escola (nome, endereço, domínio, limite de usuários)
//   2. Contrato institucional (duração, data, documentos)
//   3. Administrador responsável (nome, email, senha, telefone)
//   4. Cursos oferecidos (opcional, pode adicionar múltiplos)
//
// Persiste o ID da escola criada em sessionStorage para
// permitir retomar em caso de falha nas etapas posteriores.
//
// Estilo: CadastroInstituicoes.module.css
// ============================================================

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconBuilding, IconMapPin, IconMail, IconUsers,
  IconUserPlus, IconX, IconCircleCheck, IconAlertCircle, IconLoader2,
  IconChevronRight, IconChevronLeft, IconBook, IconPencil, IconPlus,
  IconFileText, IconCalendar, IconEye, IconArrowLeft
} from '@tabler/icons-react';
import { api } from '../services/api';
import styles from './CadastroInstituicoes.module.css';

const EMPTY_COURSE = { cur_nome: '', cur_descricao: '', cur_semestres: '' };
const PENDING_ESC_KEY = 'cadastrar_pendingEscId';

function calcExpiry(inicio, duracao) {
  if (!inicio || !duracao) return null;
  const [y, m, d] = inicio.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (duracao === '1ano') date.setFullYear(date.getFullYear() + 1);
  else if (duracao === '2anos') date.setFullYear(date.getFullYear() + 2);
  else if (duracao === '5anos') date.setFullYear(date.getFullYear() + 5);
  return date.toISOString().split('T')[0];
}

function formatDateStr(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
}

export function Cadastrar() {
  const navigate = useNavigate();

  // Se há um esc_id pendente em sessionStorage (escola criada mas admin falhou),
  // retoma o cadastro a partir do passo de administrador (etapa 3).
  const pendingEscId = sessionStorage.getItem(PENDING_ESC_KEY);
  const [step, setStep] = useState(pendingEscId ? 3 : 1);
  const [stepError, setStepError] = useState('');

  const [formData, setFormData] = useState({
    esc_nome: '', esc_endereco: '', esc_dominio: '',
    esc_max_usuarios: '', esc_contrato_duracao: '', esc_contrato_inicio: ''
  });
  const [adminData, setAdminData] = useState({
    usu_nome: '', usu_email: '', usu_telefone: '', usu_senha: '', usu_confirmSenha: ''
  });
  const [coursesList, setCoursesList] = useState([]);
  const [newCourse, setNewCourse] = useState(EMPTY_COURSE);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [contractFile, setContractFile] = useState(null);
  const [ocrFile, setOcrFile] = useState(null);

  const [suggestions, setSuggestions] = useState([]);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const geocodeTimer = useRef(null);
  const submitLockRef = useRef(false);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Persiste o ID da escola criada em sessionStorage para sobreviver a refreshes de página.
  // Isso evita criar uma escola duplicada quando o passo de admin falha e o usuário recarrega.
  const [createdEscId, setCreatedEscId] = useState(pendingEscId || null);

  function persistEscId(id) {
    setCreatedEscId(id);
    if (id) sessionStorage.setItem(PENDING_ESC_KEY, String(id));
    else sessionStorage.removeItem(PENDING_ESC_KEY);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function handleAddressChange(e) {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, esc_endereco: value }));
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    if (value.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    geocodeTimer.current = setTimeout(async () => {
      setGeocodeLoading(true);
      try {
        const results = await api.geocodeAddress(value);
        const lista = Array.isArray(results) ? results : (results?.sugestoes ?? []);
        setSuggestions(lista);
        setShowSuggestions(lista.length > 0);
      } catch {
        setSuggestions([]); setShowSuggestions(false);
      } finally { setGeocodeLoading(false); }
    }, 400);
  }

  function handleSelectSuggestion(displayName) {
    setFormData(prev => ({ ...prev, esc_endereco: displayName }));
    setSuggestions([]); setShowSuggestions(false);
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
  }

  function handleAdminChange(e) {
    const { name, value } = e.target;
    setAdminData(prev => ({ ...prev, [name]: value }));
  }

  function handleCourseChange(e) {
    const { name, value } = e.target;
    setNewCourse(prev => ({ ...prev, [name]: value }));
  }

  function handleAddCourse() {
    if (!newCourse.cur_nome.trim()) { setStepError('Preencha o nome do curso.'); return; }
    const semVal = parseInt(newCourse.cur_semestres);
    if (!newCourse.cur_semestres || isNaN(semVal) || semVal < 1) {
      setStepError('Informe a quantidade de semestres/módulos (mínimo 1).');
      return;
    }
    if (editingCourseId !== null) {
      setCoursesList(prev => prev.map(c => c.cur_id === editingCourseId ? { ...newCourse, cur_id: editingCourseId } : c));
      setEditingCourseId(null);
    } else {
      setCoursesList(prev => [...prev, { ...newCourse, cur_id: Date.now() }]);
    }
    setNewCourse(EMPTY_COURSE); setStepError('');
  }

  function handleEditCourse(course) {
    setEditingCourseId(course.cur_id);
    setNewCourse({
      cur_nome: course.cur_nome,
      cur_descricao: course.cur_descricao || '',
      cur_semestres: course.cur_semestre != null ? String(course.cur_semestre) : ''
    });
    setStepError('');
  }

  function handleCancelCourseEdit() {
    setEditingCourseId(null); setNewCourse(EMPTY_COURSE); setStepError('');
  }

  function handleRemoveCourse(courseId) {
    setCoursesList(prev => prev.filter(c => c.cur_id !== courseId));
    if (editingCourseId === courseId) { setEditingCourseId(null); setNewCourse(EMPTY_COURSE); }
  }

  function handleNextStep() {
    setStepError('');
    if (step === 1) {
      if (!formData.esc_nome.trim() || !formData.esc_endereco.trim()) {
        setStepError('Preencha os campos obrigatórios antes de continuar.'); return;
      }
      setStep(2);
    } else if (step === 2) {
      if (formData.esc_contrato_duracao && !formData.esc_contrato_inicio) {
        setStepError('Informe a data de início do contrato.'); return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!adminData.usu_nome.trim() || !adminData.usu_email.trim() || !adminData.usu_senha.trim()) {
        setStepError('Preencha os campos obrigatórios do administrador.'); return;
      }
      if (adminData.usu_senha !== adminData.usu_confirmSenha) {
        setStepError('As senhas não coincidem.'); return;
      }
      setStep(4);
    }
  }

  function handlePrevStep() {
    setStepError('');
    // Se há uma escola pendente, não voltar antes do passo 3
    const minStep = pendingEscId ? 3 : 1;
    setStep(s => (s > minStep ? s - 1 : minStep));
  }

  function handleCancel() {
    if (pendingEscId) {
      if (!window.confirm('Há um cadastro incompleto. Ao cancelar, a instituição já criada permanecerá na lista sem administrador. Deseja continuar?')) return;
      persistEscId(null);
    }
    navigate('/cadastrar');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setSubmitError(''); setSubmitLoading(true);

    try {
      let escId = createdEscId;
      if (!escId) {
        const schoolPayload = {
          esc_nome: formData.esc_nome,
          esc_endereco: formData.esc_endereco,
          ...(formData.esc_dominio ? { esc_dominio: formData.esc_dominio } : {}),
          ...(formData.esc_max_usuarios ? { esc_max_usuarios: parseInt(formData.esc_max_usuarios) } : {})
        };
        const createdSchool = await api.createSchool(schoolPayload);
        escId = createdSchool.escola?.esc_id ?? createdSchool.esc_id;
        persistEscId(escId);
      }

      if (formData.esc_contrato_duracao && formData.esc_contrato_inicio) {
        try {
          await api.createContract(escId, {
            duracao: formData.esc_contrato_duracao,
            data_inicio: formData.esc_contrato_inicio
          });
        } catch { /* contrato pode ser adicionado depois */ }
      }
      if (contractFile) {
        try { await api.uploadContractFile(escId, contractFile); } catch { /* pode enviar depois */ }
      }
      if (ocrFile) {
        try { await api.uploadOcrTemplate(escId, ocrFile); } catch { /* pode enviar depois */ }
      }

      // Passo crítico: criar o admin — se falhar, o pendingEscId em sessionStorage
      // permite que o usuário retome a partir desta etapa mesmo após recarregar a página.
      await api.createUser({
        usu_nome: adminData.usu_nome,
        usu_email: adminData.usu_email,
        usu_senha: adminData.usu_senha,
        usu_telefone: adminData.usu_telefone || undefined,
        per_tipo: 1,
        per_escola_id: escId
      });

      const courseErrors = [];
      for (const course of coursesList) {
        try {
          await api.createCourse({
            cur_nome: course.cur_nome,
            cur_descricao: course.cur_descricao || undefined,
            cur_semestres: course.cur_semestres ? parseInt(course.cur_semestres) : undefined,
            esc_id: escId
          });
        } catch { courseErrors.push(course.cur_nome); }
      }

      let successMsg = `Instituição "${formData.esc_nome || 'nova'}" cadastrada com sucesso!`;
      if (courseErrors.length > 0) successMsg += ` Erro ao criar: ${courseErrors.join(', ')}.`;
      else if (coursesList.length > 0) successMsg += ` ${coursesList.length} curso(s) cadastrado(s).`;

      persistEscId(null);
      navigate('/cadastrar', { state: { success: successMsg } });
    } catch (err) {
      setSubmitError(err.message || 'Erro ao cadastrar instituição.');
    } finally {
      submitLockRef.current = false;
      setSubmitLoading(false);
    }
  }

  const showCourseBtn = editingCourseId !== null || newCourse.cur_nome.trim() || newCourse.cur_descricao.trim() || newCourse.cur_semestres.trim();

  return (
    <div className={styles.container} style={{ maxWidth: 720 }}>
      <div className={styles.header} style={{ marginBottom: 20 }}>
        <div>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={handleCancel}
            style={{ marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <IconArrowLeft size={14} /> Voltar
          </button>
          <h1 className={styles.title}>Nova Instituição</h1>
          <p className={styles.subtitle}>Cadastre uma nova instituição parceira na plataforma</p>
        </div>
      </div>

      {pendingEscId && (
        <div className={styles.alertError} style={{ marginBottom: 16, borderColor: '#fcd34d', backgroundColor: '#fffbeb', color: '#92400e' }}>
          <IconAlertCircle size={16} />
          Cadastro retomado: a instituição já foi registrada, mas o administrador ainda não foi criado. Preencha os dados do administrador para finalizar.
        </div>
      )}

      <div className={styles.formCard}>
        <div className={styles.stepIndicator}>
          {[
            { n: 1, label: 'Dados da Escola', disabled: !!pendingEscId },
            { n: 2, label: 'Contrato', disabled: !!pendingEscId },
            { n: 3, label: 'Administrador', disabled: false },
            { n: 4, label: 'Cursos', disabled: false },
          ].map(({ n, label }, i, arr) => (
            <div key={n} style={{ display: 'contents' }}>
              <div className={`${styles.stepItem} ${step >= n ? styles.stepActive : ''}`}>
                <div className={styles.stepCircle}>{n}</div>
                <span className={styles.stepLabel}>{label}</span>
              </div>
              {i < arr.length - 1 && (
                <div className={`${styles.stepLine} ${step > n ? styles.stepLineDone : ''}`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <>
              <div className={styles.sectionHeader}>
                <IconBuilding size={18} />
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

                <div className={styles.formGroup} style={{ gridColumn: '1 / -1', position: 'relative' }}>
                  <label htmlFor="esc_endereco" className={styles.label}>
                    <IconMapPin size={14} /> Endereço <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text" id="esc_endereco" name="esc_endereco" className={styles.input}
                    placeholder="Digite o endereço para buscar sugestões..."
                    value={formData.esc_endereco}
                    onChange={handleAddressChange}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    autoComplete="off"
                  />
                  {geocodeLoading && (
                    <span className={styles.geocodeLoading}>
                      <IconLoader2 size={12} className={styles.spin} /> Buscando endereços...
                    </span>
                  )}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className={styles.suggestionsDropdown}>
                      {suggestions.map((s, i) => (
                        <button key={i} type="button" className={styles.suggestionItem}
                          onMouseDown={() => handleSelectSuggestion(s.display_name ?? s)}>
                          <IconMapPin size={12} />
                          {s.display_name ?? s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="esc_dominio" className={styles.label}>
                    <IconMail size={14} /> Domínio de E-mail
                  </label>
                  <input type="text" id="esc_dominio" name="esc_dominio" className={styles.input}
                    placeholder="Ex: inova.edu.br"
                    value={formData.esc_dominio} onChange={handleChange} />
                  <span className={styles.fieldHint}>Restringe cadastros ao domínio informado</span>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="esc_max_usuarios" className={styles.label}>
                    <IconUsers size={14} /> Limite de Usuários
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
                  Próximo <IconChevronRight size={16} />
                </button>
                <button type="button" className={styles.cancelBtn} onClick={handleCancel}>Cancelar</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className={styles.sectionHeader}>
                <IconFileText size={18} />
                <span>Contrato Institucional</span>
              </div>
              <p className={styles.sectionDescription}>
                Defina os dados do contrato e anexe o documento assinado (opcional). Tudo pode ser atualizado depois.
              </p>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="esc_contrato_duracao" className={styles.label}>
                    <IconFileText size={14} /> Duração do Contrato
                  </label>
                  <select id="esc_contrato_duracao" name="esc_contrato_duracao"
                    className={styles.input} value={formData.esc_contrato_duracao} onChange={handleChange}>
                    <option value="">Sem contrato</option>
                    <option value="1ano">1 Ano</option>
                    <option value="2anos">2 Anos</option>
                    <option value="5anos">5 Anos</option>
                  </select>
                  <span className={styles.fieldHint}>Período de vigência do contrato com a plataforma</span>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="esc_contrato_inicio" className={styles.label}>
                    <IconCalendar size={14} /> Data de Início
                  </label>
                  <input type="date" id="esc_contrato_inicio" name="esc_contrato_inicio"
                    className={styles.input} value={formData.esc_contrato_inicio}
                    onChange={handleChange} disabled={!formData.esc_contrato_duracao} />
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
                <IconFileText size={16} />
                <span style={{ fontSize: 14 }}>Documento do Contrato</span>
                <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-secondary)' }}>(opcional)</span>
              </div>

              {!contractFile ? (
                <label className={styles.fileUploadZone} htmlFor="contractFileInput">
                  <input type="file" id="contractFileInput" accept=".pdf,.doc,.docx"
                    onChange={(e) => setContractFile(e.target.files[0] || null)} />
                  <div className={styles.fileUploadIcon}><IconFileText size={32} /></div>
                  <p className={styles.fileUploadText}><strong>Clique para selecionar</strong> o arquivo do contrato</p>
                  <p className={styles.fileHint}>PDF, DOC ou DOCX</p>
                </label>
              ) : (
                <div className={styles.fileSelected}>
                  <IconFileText size={18} style={{ color: 'var(--btn-primary-bg)', flexShrink: 0 }} />
                  <span className={styles.fileSelectedName}>{contractFile.name}</span>
                  <span className={styles.fileSelectedSize}>{(contractFile.size / 1024).toFixed(0)} KB</span>
                  <button type="button" className={styles.fileRemoveBtn} onClick={() => setContractFile(null)} title="Remover">
                    <IconX size={15} />
                  </button>
                </div>
              )}

              <hr className={styles.divider} />
              <div className={styles.sectionHeader} style={{ marginBottom: 12 }}>
                <IconFileText size={16} />
                <span style={{ fontSize: 14 }}>Modelo de OCR para Matrícula</span>
                <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-secondary)' }}>(opcional)</span>
              </div>

              {!ocrFile ? (
                <label className={styles.fileUploadZone} htmlFor="ocrFileInput">
                  <input type="file" id="ocrFileInput" accept=".pdf"
                    onChange={(e) => setOcrFile(e.target.files[0] || null)} />
                  <div className={styles.fileUploadIcon}><IconFileText size={32} /></div>
                  <p className={styles.fileUploadText}><strong>Clique para selecionar</strong> o modelo de comprovante</p>
                  <p className={styles.fileHint}>Somente PDF — máximo 10 MB</p>
                </label>
              ) : (
                <div className={styles.fileSelected}>
                  <IconFileText size={18} style={{ color: 'var(--btn-primary-bg)', flexShrink: 0 }} />
                  <span className={styles.fileSelectedName}>{ocrFile.name}</span>
                  <span className={styles.fileSelectedSize}>{(ocrFile.size / 1024).toFixed(0)} KB</span>
                  <button type="button" className={styles.fileRemoveBtn}
                    onClick={() => window.open(URL.createObjectURL(ocrFile), '_blank', 'noopener,noreferrer')} title="Visualizar">
                    <IconEye size={15} />
                  </button>
                  <button type="button" className={styles.fileRemoveBtn} onClick={() => setOcrFile(null)} title="Remover">
                    <IconX size={15} />
                  </button>
                </div>
              )}

              {stepError && <p className={styles.inlineError} style={{ marginTop: 16 }}>{stepError}</p>}
              <div className={styles.formActions}>
                <button type="button" className={styles.submitBtn} onClick={handleNextStep}>
                  Próximo <IconChevronRight size={16} />
                </button>
                <button type="button" className={styles.cancelBtn} onClick={handlePrevStep}>
                  <IconChevronLeft size={16} /> Voltar
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className={styles.sectionHeader}>
                <IconUserPlus size={18} />
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
                    <IconMail size={14} /> E-mail <span className={styles.required}>*</span>
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
                  Próximo <IconChevronRight size={16} />
                </button>
                <button type="button" className={styles.cancelBtn} onClick={handlePrevStep}>
                  <IconChevronLeft size={16} /> Voltar
                </button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className={styles.sectionHeader}>
                <IconBook size={18} />
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
                    placeholder="Ex: 5" value={newCourse.cur_semestres} onChange={handleCourseChange} min="1" />
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
                    {editingCourseId ? <><IconPencil size={14} /> Salvar Alterações</> : <><IconPlus size={14} /> Adicionar Curso</>}
                  </button>
                )}
                {editingCourseId && (
                  <button type="button" className={styles.cancelEditBtn} onClick={handleCancelCourseEdit}>
                    <IconX size={14} /> Cancelar Edição
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
                        {course.cur_semestres && (
                          <span className={styles.semestresBadge}>{course.cur_semestres} sem.</span>
                        )}
                      </div>
                      <div className={styles.courseTagActions}>
                        <button type="button" className={styles.editCourseBtn}
                          onClick={() => handleEditCourse(course)} title="Editar curso">
                          <IconPencil size={13} />
                        </button>
                        <button type="button" className={styles.removeAdminBtn}
                          onClick={() => handleRemoveCourse(course.cur_id)} title="Remover">
                          <IconX size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {submitError && (
                <div className={styles.alertError}>
                  <IconAlertCircle size={16} /> {submitError}
                </div>
              )}

              <div className={styles.formActions}>
                <button type="submit" className={styles.submitBtn} disabled={submitLoading}>
                  {submitLoading
                    ? <><IconLoader2 size={16} className={styles.spin} /> Cadastrando...</>
                    : <><IconCircleCheck size={16} /> Cadastrar Instituição</>}
                </button>
                <button type="button" className={styles.cancelBtn} onClick={handlePrevStep}>
                  <IconChevronLeft size={16} /> Voltar
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
