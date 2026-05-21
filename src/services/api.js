// ============================================================
// services/api.js — Serviço de comunicação com a API
//
// Este arquivo centraliza TODAS as chamadas à API do backend.
// Por enquanto usa dados mockados (fictícios) para simular
// o comportamento real da API durante o desenvolvimento.
//
// Como funciona:
//   Em vez de fazer requisições HTTP reais (fetch/axios),
//   cada função espera um tempo (delay) e retorna dados
//   do mockData.js — simulando latência de rede.
//
//   Quando o backend estiver pronto, basta substituir o
//   conteúdo de cada função por um fetch() real, sem
//   precisar mudar os componentes que as chamam.
//
// Dados consumidos: mockData.js (todos os arrays de api*)
//
// Padrão usado: objeto "api" com métodos async/await.
//   async → marca a função como assíncrona (retorna Promise)
//   await → pausa a execução até a Promise resolver
// ============================================================

import {
  apiUsersData,
  apiSchoolsData,
  apiRidesData,
  apiSuggestionsData,
  apiStatsData,
  apiCoursesData,
  apiRecentReportsData,
  auditLogData
} from '../data/mockData';

// delay: função utilitária que cria uma pausa artificial.
// Simula o tempo que uma requisição HTTP real levaria.
// Promise + setTimeout = "espere X milissegundos e continue".
function delay(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// api: objeto exportado com todos os métodos da aplicação.
// Os componentes importam este objeto e chamam seus métodos:
//   import { api } from '../services/api'
//   await api.login(email, senha)
export const api = {

  // ── Autenticação ───────────────────────────────────────────

  // login: autentica o usuário.
  // Salva tokens no localStorage para manter a sessão ativa.
  // localStorage → armazenamento do navegador (persiste entre abas).
  // Date.now() → número único baseado no tempo atual (para tokens únicos).
  async login(email, senha) {
    await delay(300);
    const mockToken = 'mock_token_' + Date.now();
    const mockRefreshToken = 'mock_refresh_token_' + Date.now();
    localStorage.setItem('auth_token', mockToken);
    localStorage.setItem('refresh_token', mockRefreshToken);
    return {
      access_token: mockToken,
      refresh_token: mockRefreshToken,
      user: { email, usu_id: 6, usu_nome: 'Admin Sistema' }
    };
  },

  // getMe: busca os dados do usuário atualmente logado.
  // Usado pelo Login.jsx após autenticar para verificar o perfil.
  // per_tipo: 2 = Desenvolvedor, 1 = Administrador, 0 = Usuário comum.
  async getMe() {
    await delay(200);
    return {
      usu_id: 6,
      usu_nome: 'Admin Sistema',
      usu_email: 'admin@sistema.inova.br',
      usu_status: 1,
      usu_verificacao: 2,
      per_tipo: 2
    };
  },

  // logout: remove todos os dados de sessão do localStorage.
  // Não é async porque não precisa esperar nada — é síncrono.
  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_info');
  },

  // ── Estatísticas (Dashboard) ───────────────────────────────
  // type: qual categoria de estatística buscar.
  // Retorna objetos com contadores usados nos cards do Dashboard.

  async getStats(type) {
    await delay(300);
    // Mapeia o tipo recebido para a chave do objeto apiStatsData.
    // O operador ternário encadeado (?:) funciona como if/else if/else.
    const typeKey = type === 'usuarios' ? 'usuarios'
                    : type === 'caronas' ? 'caronas'
                    : type === 'sugestoes' ? 'sugestoes'
                    : 'usuarios'; // padrão
    return apiStatsData[typeKey] || { stats: {} };
  },

  // ── Escolas ─────────────────────────────────────────────────

  // Retorna todas as escolas cadastradas.
  async getSchools() {
    await delay(300);
    return apiSchoolsData;
  },

  // Cria uma nova escola.
  // Math.max(...array.map(...)) → pega o maior ID existente e soma 1.
  // O spread operator (...) expande o array como argumentos individuais.
  async createSchool(data) {
    await delay(300);
    const newId = Math.max(...apiSchoolsData.map(s => s.esc_id)) + 1;
    const newSchool = { ...data, esc_id: newId }; // copia data e adiciona o ID
    apiSchoolsData.push(newSchool); // adiciona ao array em memória
    return newSchool;
  },

  // Atualiza os dados de uma escola existente.
  // findIndex → retorna a posição do item no array (-1 se não achar).
  async updateSchool(id, data) {
    await delay(300);
    const idx = apiSchoolsData.findIndex(s => s.esc_id === id);
    if (idx === -1) throw new Error('Escola não encontrada');
    const updated = { ...apiSchoolsData[idx], ...data }; // mescla dados antigos com novos
    apiSchoolsData[idx] = updated;
    return updated;
  },

  // Remove uma escola do array (simula DELETE na API).
  // splice(idx, 1) → remove 1 elemento na posição idx.
  async deleteSchool(id) {
    await delay(300);
    const idx = apiSchoolsData.findIndex(s => s.esc_id === id);
    if (idx === -1) throw new Error('Escola não encontrada');
    apiSchoolsData.splice(idx, 1);
    return { success: true };
  },

  // ── Usuários (criação) ─────────────────────────────────────

  // Cria um novo usuário com status inicial "pendente de verificação".
  async createUser(data) {
    await delay(300);
    const newId = Math.max(...apiUsersData.map(u => u.usu_id)) + 1;
    const newUser = {
      usu_id: newId,
      usu_nome: data.usu_nome,
      usu_email: data.usu_email,
      usu_telefone: data.usu_telefone || null,
      usu_status: 1,        // 1 = ativo
      usu_verificacao: 0,   // 0 = não verificado
      usu_foto: null
    };
    apiUsersData.push(newUser);
    return { usuario: newUser };
  },

  // ── Usuários (Admin) ───────────────────────────────────────

  // Busca lista de usuários com suporte a paginação e filtro de texto.
  // Desestruturação com valores padrão: { page = 1, limit = 50, q = '' }
  // significa que esses parâmetros são opcionais.
  async getUsers({ page = 1, limit = 50, q = '' } = {}) {
    await delay(300);
    let filtered = apiUsersData;

    // Filtra por nome ou e-mail se uma busca (q) foi fornecida.
    // toLowerCase() normaliza maiúsculas/minúsculas para a comparação.
    if (q) {
      const query = q.toLowerCase();
      filtered = filtered.filter(u =>
        (u.usu_nome?.toLowerCase().includes(query) || false) ||
        (u.usu_email?.toLowerCase().includes(query) || false)
      );
    }

    // Paginação: calcula o índice de início e fim do "pedaço" (slice).
    // Página 1: itens 0 a 49. Página 2: itens 50 a 99. Etc.
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      usuarios: filtered.slice(start, end), // "fatia" do array para esta página
      total: filtered.length,               // total sem paginação (para a UI saber quantas páginas há)
      page,
      limit
    };
  },

  // Busca um único usuário pelo seu ID.
  // find → retorna o primeiro elemento que satisfaz a condição.
  async getUser(userId) {
    await delay(200);
    const user = apiUsersData.find(u => u.usu_id === userId);
    if (!user) throw new Error('Usuário não encontrado');
    return user;
  },

  // Altera o status de um usuário (ativo/inativo/suspenso).
  async updateUserStatus(userId, status) {
    await delay(250);
    const user = apiUsersData.find(u => u.usu_id === userId);
    if (!user) throw new Error('Usuário não encontrado');
    user.usu_status = status;
    return user;
  },

  // Atualiza dados do perfil de um usuário.
  // Object.assign(alvo, fonte) → copia as propriedades de "fonte" para "alvo".
  async updateUserProfile(userId, profileData) {
    await delay(250);
    const user = apiUsersData.find(u => u.usu_id === userId);
    if (!user) throw new Error('Usuário não encontrado');
    Object.assign(user, profileData);
    return user;
  },

  // Alias mantido para compatibilidade com código antigo.
  // Delega para getUsers passando a string de busca.
  async searchUsers(query) {
    return this.getUsers({ q: query });
  },

  // ── Caronas ────────────────────────────────────────────────

  // Retorna todas as caronas cadastradas.
  async getCaronas() {
    await delay(300);
    return apiRidesData;
  },

  // ── Sugestões e Denúncias ──────────────────────────────────

  // Retorna todas as sugestões/denúncias.
  async getSugestoes() {
    await delay(300);
    return { sugestoes: apiSuggestionsData };
  },

  // Marca uma sugestão como "Em análise" (status 2).
  async analisarSugestao(sugId) {
    await delay(250);
    const sug = apiSuggestionsData.find(s => s.sug_id === sugId);
    if (!sug) throw new Error('Sugestão não encontrada');
    sug.sug_status = 2;
    return sug;
  },

  // Responde a uma sugestão e muda o status para "Resolvido" (1).
  async responderSugestao(sugId, resposta) {
    await delay(250);
    const sug = apiSuggestionsData.find(s => s.sug_id === sugId);
    if (!sug) throw new Error('Sugestão não encontrada');
    sug.sug_resposta = resposta;
    sug.sug_status = 1;
    return sug;
  },

  // ── Notificações ───────────────────────────────────────────

  // Simula o envio de uma notificação para usuários.
  // Desestruturação: { titulo, mensagem, tipo, usu_id } extrai
  // as propriedades do objeto recebido como parâmetro.
  async enviarNotificacao({ titulo, mensagem, tipo, usu_id } = {}) {
    await delay(300);
    return {
      noti_id: Date.now(), // ID único baseado no timestamp
      titulo,
      mensagem,
      tipo,
      usu_id,
      enviado_em: new Date().toISOString() // data/hora atual em formato ISO
    };
  },

  // ── Logs de Auditoria (apenas Desenvolvedor) ───────────────

  // Busca logs de auditoria com filtros opcionais e paginação.
  // Somente usuários com per_tipo = 2 (Desenvolvedor) têm acesso.
  async getLogs({ page = 1, limit = 20, acao, dataInicio, dataFim } = {}) {
    await delay(300);
    let filtered = [...auditLogData]; // cópia rasa do array (não modifica o original)

    // Filtra por ação se fornecida (case-insensitive).
    if (acao) {
      const q = acao.toUpperCase();
      filtered = filtered.filter((l) => l.acao.toUpperCase().includes(q));
    }

    // Filtra por data de início: converte para timestamp (número)
    // e compara para manter apenas logs após a data informada.
    if (dataInicio) {
      const from = new Date(dataInicio).getTime();
      filtered = filtered.filter((l) => new Date(l.criado_em).getTime() >= from);
    }

    // Filtra por data de fim: ajusta para o final do dia (23:59:59).
    if (dataFim) {
      const to = new Date(dataFim);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((l) => new Date(l.criado_em).getTime() <= to.getTime());
    }

    const totalGeral = filtered.length;
    const start = (page - 1) * limit;
    return {
      logs: filtered.slice(start, start + limit),
      totalGeral,
      page,
      limit,
    };
  },

  // Exporta todos os logs de auditoria como arquivo CSV.
  // Cria um arquivo dinamicamente no navegador e dispara o download.
  async exportLogs() {
    await delay(400);

    // Define as colunas do CSV
    const headers = ['audit_id', 'criado_em', 'usu_id', 'acao', 'tabela', 'registro_id', 'ip'];

    // Converte cada log em uma linha CSV (com valores entre aspas)
    const rows = auditLogData.map((l) =>
      headers.map((h) => JSON.stringify(l[h] ?? '')).join(',')
    );

    // Junta cabeçalho e linhas com quebras de linha
    const csv = [headers.join(','), ...rows].join('\n');

    // Blob: objeto que representa dados brutos (aqui, o conteúdo do CSV)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    // URL.createObjectURL: cria uma URL temporária apontando para o Blob
    const url = URL.createObjectURL(blob);

    // Cria um link <a> invisível, aponta para o CSV e clica nele
    // para disparar o download automático no navegador.
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`; // nome do arquivo
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // libera a memória da URL temporária

    return { success: true };
  },

  // ── Penalidades ────────────────────────────────────────────

  // Busca as penalidades de um usuário específico pelo userId.
  // Os dados estão em um objeto onde a chave é o ID do usuário.
  async getPenalidades(userId, { ativas, page, limit } = {}) {
    await delay(300);
    const penaltyData = {
      // Usuário 5 (Lucas) tem 1 penalidade ativa
      5: [
        {
          pen_id: 1,
          pen_tipo: 2,
          pen_motivo: 'Comportamento inadequado com motorista.',
          pen_aplicado_em: '2026-03-31T10:00:00.000Z',
          pen_expira_em: '2026-04-29T10:00:00.000Z',
          pen_aplicado_por: 6,
          pen_ativo: 1
        }
      ],
      // Usuário 9 (Fábio Suspenso) tem 2 penalidades
      9: [
        {
          pen_id: 2,
          pen_tipo: 1,
          pen_motivo: 'Cancelamento de última hora recorrente.',
          pen_aplicado_em: '2026-04-01T12:00:00.000Z',
          pen_expira_em: '2026-04-28T12:00:00.000Z',
          pen_aplicado_por: 6,
          pen_ativo: 1  // ativa
        },
        {
          pen_id: 3,
          pen_tipo: 3,
          pen_motivo: 'Reincidência após penalidade anterior.',
          pen_aplicado_em: '2026-01-10T09:00:00.000Z',
          pen_expira_em: '2026-02-10T09:00:00.000Z',
          pen_aplicado_por: 6,
          pen_ativo: 0  // expirada
        }
      ]
    };

    // Busca penalidades do userId. Se não houver, retorna array vazio.
    const penalties = penaltyData[userId] || [];
    return {
      penalidades: penalties,
      total: penalties.length
    };
  },

  // Aplica uma nova penalidade a um usuário.
  async applyPenalidade(userId, { pen_tipo, pen_duracao, pen_motivo }) {
    await delay(300);
    return {
      pen_id: Date.now(), // ID único
      usu_id: userId,
      pen_tipo,
      pen_duracao,
      pen_motivo,
      pen_aplicado_em: new Date().toISOString(),
      pen_ativo: 1
    };
  },

  // Remove (desativa) uma penalidade pelo seu ID.
  async removePenalidade(penId) {
    await delay(250);
    return { success: true, pen_id: penId };
  },

  // ── Cursos ─────────────────────────────────────────────────

  // Busca cursos, opcionalmente filtrando por escola (escId).
  // escId != null → usa != (não estrito) para pegar null E undefined.
  async getCourses(escId) {
    await delay(300);
    if (escId != null) {
      return apiCoursesData.filter(c => c.esc_id === escId);
    }
    return apiCoursesData;
  },

  // Cria um novo curso vinculado a uma escola.
  async createCourse(data) {
    await delay(300);
    const newId = apiCoursesData.length > 0
      ? Math.max(...apiCoursesData.map(c => c.cur_id)) + 1
      : 1;
    const newCourse = { ...data, cur_id: newId };
    apiCoursesData.push(newCourse);
    return newCourse;
  },

  // Atualiza os dados de um curso existente.
  async updateCourse(id, data) {
    await delay(300);
    const idx = apiCoursesData.findIndex(c => c.cur_id === id);
    if (idx === -1) throw new Error('Curso não encontrado');
    const updated = { ...apiCoursesData[idx], ...data };
    apiCoursesData[idx] = updated;
    return updated;
  },

  // Remove um curso pelo ID.
  async deleteCourse(id) {
    await delay(300);
    const idx = apiCoursesData.findIndex(c => c.cur_id === id);
    if (idx === -1) throw new Error('Curso não encontrado');
    apiCoursesData.splice(idx, 1);
    return { success: true };
  },

  // ── Relatórios ─────────────────────────────────────────────

  // Retorna os relatórios gerados recentemente.
  async getRecentReports() {
    await delay(300);
    return { relatorios: apiRecentReportsData };
  },

  // Simula a geração de um novo relatório.
  // tipo: identificador do tipo (ex: 'users', 'car', 'barchart2')
  // Adiciona o novo relatório no início da lista (unshift).
  async generateReport(tipo) {
    await delay(800); // delay maior para simular processamento
    const titulos = {
      users: 'Relatório de Usuários',
      car: 'Relatório de Caronas',
      alertcircle: 'Relatório de Denúncias',
      barchart2: 'Relatório Geral'
    };
    const titulo = titulos[tipo?.toLowerCase()] ?? 'Relatório';
    // toLocaleDateString → formata a data no padrão brasileiro
    const mes = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const newReport = {
      rel_id: Date.now(),
      rel_titulo: `${titulo} - ${mes}`,
      rel_tipo: tipo,
      rel_gerado_em: new Date().toISOString(),
      // toFixed(1) → arredonda para 1 casa decimal (ex: 1.7 MB)
      rel_tamanho: `${(Math.random() * 2.5 + 0.5).toFixed(1)} MB`,
      rel_gerado_por: 6 // ID do admin que gerou
    };
    apiRecentReportsData.unshift(newReport); // insere no início da lista
    return newReport;
  }
};
