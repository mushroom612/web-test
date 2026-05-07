import { apiUsersData, apiSchoolsData, apiRidesData, apiSuggestionsData, apiStatsData, apiCoursesData } from '../data/mockData';

// Simula latência de rede
function delay(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────

  async login(email, senha) {
    // Mock login
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

  async getMe() {
    // Mock get current user
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

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_info');
  },

  // ── Stats (Dashboard) ──────────────────────────────────────────────────────
  // type: 'usuarios' | 'caronas' | 'sugestoes' | 'sistema' (dev only) | 'documentos' | 'contratos'

  async getStats(type) {
    // Mock stats
    await delay(300);
    const typeKey = type === 'usuarios' ? 'usuarios' 
                    : type === 'caronas' ? 'caronas'
                    : type === 'sugestoes' ? 'sugestoes'
                    : 'usuarios';
    return apiStatsData[typeKey] || { stats: {} };
  },

  // ── Escolas ────────────────────────────────────────────────────────────────

  async getSchools() {
    // Mock get schools
    await delay(300);
    return apiSchoolsData;
  },

  async createSchool(data) {
    // Mock create school
    await delay(300);
    const newId = Math.max(...apiSchoolsData.map(s => s.esc_id)) + 1;
    const newSchool = { ...data, esc_id: newId };
    apiSchoolsData.push(newSchool);
    return newSchool;
  },

  async updateSchool(id, data) {
    // Mock update school
    await delay(300);
    const idx = apiSchoolsData.findIndex(s => s.esc_id === id);
    if (idx === -1) throw new Error('Escola não encontrada');
    const updated = { ...apiSchoolsData[idx], ...data };
    apiSchoolsData[idx] = updated;
    return updated;
  },

  async deleteSchool(id) {
    // Mock delete school
    await delay(300);
    const idx = apiSchoolsData.findIndex(s => s.esc_id === id);
    if (idx === -1) throw new Error('Escola não encontrada');
    apiSchoolsData.splice(idx, 1);
    return { success: true };
  },

  // ── Usuários (criação) ────────────────────────────────────────────────────

  async createUser(data) {
    await delay(300);
    const newId = Math.max(...apiUsersData.map(u => u.usu_id)) + 1;
    const newUser = {
      usu_id: newId,
      usu_nome: data.usu_nome,
      usu_email: data.usu_email,
      usu_telefone: data.usu_telefone || null,
      usu_status: 1,
      usu_verificacao: 0,
      usu_foto: null
    };
    apiUsersData.push(newUser);
    return { usuario: newUser };
  },

  // ── Usuários (Admin) ───────────────────────────────────────────────────────

  async getUsers({ page = 1, limit = 50, q = '' } = {}) {
    // Mock get users
    await delay(300);
    let filtered = apiUsersData;
    if (q) {
      const query = q.toLowerCase();
      filtered = filtered.filter(u => 
        (u.usu_nome?.toLowerCase().includes(query) || false) ||
        (u.usu_email?.toLowerCase().includes(query) || false)
      );
    }
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      usuarios: filtered.slice(start, end),
      total: filtered.length,
      page,
      limit
    };
  },

  async getUser(userId) {
    // Mock get user
    await delay(200);
    const user = apiUsersData.find(u => u.usu_id === userId);
    if (!user) throw new Error('Usuário não encontrado');
    return user;
  },

  async updateUserStatus(userId, status) {
    // Mock update user status
    await delay(250);
    const user = apiUsersData.find(u => u.usu_id === userId);
    if (!user) throw new Error('Usuário não encontrado');
    user.usu_status = status;
    return user;
  },

  async updateUserProfile(userId, profileData) {
    // Mock update user profile
    await delay(250);
    const user = apiUsersData.find(u => u.usu_id === userId);
    if (!user) throw new Error('Usuário não encontrado');
    Object.assign(user, profileData);
    return user;
  },

  // mantido para compatibilidade
  async searchUsers(query) {
    return this.getUsers({ q: query });
  },

  // ── Caronas ────────────────────────────────────────────────────────────────

  async getCaronas() {
    // Mock get rides
    await delay(300);
    return apiRidesData;
  },

  // ── Sugestões ──────────────────────────────────────────────────────────────

  async getSugestoes() {
    // Mock get suggestions
    await delay(300);
    return { sugestoes: apiSuggestionsData };
  },

  async analisarSugestao(sugId) {
    // Mock analyze suggestion
    await delay(250);
    const sug = apiSuggestionsData.find(s => s.sug_id === sugId);
    if (!sug) throw new Error('Sugestão não encontrada');
    sug.sug_status = 2; // Em análise
    return sug;
  },

  async responderSugestao(sugId, resposta) {
    // Mock respond to suggestion
    await delay(250);
    const sug = apiSuggestionsData.find(s => s.sug_id === sugId);
    if (!sug) throw new Error('Sugestão não encontrada');
    sug.sug_resposta = resposta;
    sug.sug_status = 1; // Resolvido
    return sug;
  },

  // ── Notificações ───────────────────────────────────────────────────────────

  async enviarNotificacao({ titulo, mensagem, tipo, usu_id } = {}) {
    // Mock send notification
    await delay(300);
    return {
      noti_id: Date.now(),
      titulo,
      mensagem,
      tipo,
      usu_id,
      enviado_em: new Date().toISOString()
    };
  },

  // ── Audit Logs (somente role 2 — Desenvolvedor) ───────────────────────────

  async getLogs({ page = 1, limit = 20, acao, tabela, usu_id } = {}) {
    // Mock get audit logs
    await delay(300);
    return {
      logs: [],
      total: 0,
      page,
      limit
    };
  },

  // ── Penalidades ────────────────────────────────────────────────────────────

  async getPenalidades(userId, { ativas, page, limit } = {}) {
    // Mock get penalties
    await delay(300);
    // Retorna penalidades mocadas se existirem
    const penaltyData = {
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
      9: [
        {
          pen_id: 2,
          pen_tipo: 1,
          pen_motivo: 'Cancelamento de última hora recorrente.',
          pen_aplicado_em: '2026-04-01T12:00:00.000Z',
          pen_expira_em: '2026-04-28T12:00:00.000Z',
          pen_aplicado_por: 6,
          pen_ativo: 1
        },
        {
          pen_id: 3,
          pen_tipo: 3,
          pen_motivo: 'Reincidência após penalidade anterior.',
          pen_aplicado_em: '2026-01-10T09:00:00.000Z',
          pen_expira_em: '2026-02-10T09:00:00.000Z',
          pen_aplicado_por: 6,
          pen_ativo: 0
        }
      ]
    };
    
    const penalties = penaltyData[userId] || [];
    return {
      penalidades: penalties,
      total: penalties.length
    };
  },

  async applyPenalidade(userId, { pen_tipo, pen_duracao, pen_motivo }) {
    // Mock apply penalty
    await delay(300);
    return {
      pen_id: Date.now(),
      usu_id: userId,
      pen_tipo,
      pen_duracao,
      pen_motivo,
      pen_aplicado_em: new Date().toISOString(),
      pen_ativo: 1
    };
  },

  async removePenalidade(penId) {
    // Mock remove penalty
    await delay(250);
    return { success: true, pen_id: penId };
  },

  // ── Cursos ─────────────────────────────────────────────────────────────────

  async getCourses(escId) {
    await delay(300);
    if (escId != null) {
      return apiCoursesData.filter(c => c.esc_id === escId);
    }
    return apiCoursesData;
  },

  async createCourse(data) {
    await delay(300);
    const newId = apiCoursesData.length > 0
      ? Math.max(...apiCoursesData.map(c => c.cur_id)) + 1
      : 1;
    const newCourse = { ...data, cur_id: newId };
    apiCoursesData.push(newCourse);
    return newCourse;
  },

  async updateCourse(id, data) {
    await delay(300);
    const idx = apiCoursesData.findIndex(c => c.cur_id === id);
    if (idx === -1) throw new Error('Curso não encontrado');
    const updated = { ...apiCoursesData[idx], ...data };
    apiCoursesData[idx] = updated;
    return updated;
  },

  async deleteCourse(id) {
    await delay(300);
    const idx = apiCoursesData.findIndex(c => c.cur_id === id);
    if (idx === -1) throw new Error('Curso não encontrado');
    apiCoursesData.splice(idx, 1);
    return { success: true };
  }
};
