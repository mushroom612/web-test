const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getToken() {
  return localStorage.getItem('auth_token');
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
  return data;
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────

  async login(email, senha) {
    const res = await fetch(`${BASE_URL}/api/usuarios/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usu_email: email, usu_senha: senha })
    });
    const data = await handleResponse(res);
    if (data.access_token) localStorage.setItem('auth_token', data.access_token);
    if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
    return data;
  },

  async getMe() {
    const res = await fetch(`${BASE_URL}/api/usuarios/me`, {
      headers: authHeaders()
    });
    return handleResponse(res);
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
    const res = await fetch(`${BASE_URL}/api/admin/stats/${type}`, {
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  // ── Escolas ────────────────────────────────────────────────────────────────

  async getSchools() {
    const res = await fetch(`${BASE_URL}/api/admin/escolas`, {
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  async createSchool(data) {
    const res = await fetch(`${BASE_URL}/api/admin/escolas`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async updateSchool(id, data) {
    const res = await fetch(`${BASE_URL}/api/admin/escolas/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async deleteSchool(id) {
    const res = await fetch(`${BASE_URL}/api/admin/escolas/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  // ── Usuários (Admin) ───────────────────────────────────────────────────────

  async getUsers({ page = 1, limit = 50, q = '' } = {}) {
    const params = new URLSearchParams({ page, limit });
    if (q) params.set('q', q);
    const res = await fetch(`${BASE_URL}/api/admin/usuarios?${params}`, {
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  async getUser(userId) {
    const res = await fetch(`${BASE_URL}/api/admin/usuarios/${userId}`, {
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  async updateUserStatus(userId, status) {
    const res = await fetch(`${BASE_URL}/api/admin/usuarios/${userId}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ usu_status: status })
    });
    return handleResponse(res);
  },

  async updateUserProfile(userId, profileData) {
    const res = await fetch(`${BASE_URL}/api/admin/usuarios/${userId}/perfil`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(profileData)
    });
    return handleResponse(res);
  },

  // mantido para compatibilidade
  async searchUsers(query) {
    return this.getUsers({ q: query });
  },

  // ── Caronas ────────────────────────────────────────────────────────────────

  async getCaronas() {
    const res = await fetch(`${BASE_URL}/api/caronas`, {
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  // ── Sugestões ──────────────────────────────────────────────────────────────

  async getSugestoes() {
    const res = await fetch(`${BASE_URL}/api/sugestoes/`, {
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  async analisarSugestao(sugId) {
    const res = await fetch(`${BASE_URL}/api/sugestoes/${sugId}/analisar`, {
      method: 'PUT',
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  async responderSugestao(sugId, resposta) {
    const res = await fetch(`${BASE_URL}/api/sugestoes/${sugId}/responder`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ resposta })
    });
    return handleResponse(res);
  },

  // ── Notificações ───────────────────────────────────────────────────────────

  async enviarNotificacao({ titulo, mensagem, tipo, usu_id } = {}) {
    const body = { titulo, mensagem, tipo };
    if (usu_id) body.usu_id = usu_id;
    const res = await fetch(`${BASE_URL}/api/notificacoes/enviar`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body)
    });
    return handleResponse(res);
  },

  // ── Audit Logs (somente role 2 — Desenvolvedor) ───────────────────────────

  async getLogs({ page = 1, limit = 20, acao, tabela, usu_id } = {}) {
    const params = new URLSearchParams({ page, limit });
    if (acao) params.set('acao', acao);
    if (tabela) params.set('tabela', tabela);
    if (usu_id) params.set('usu_id', usu_id);
    const res = await fetch(`${BASE_URL}/api/admin/logs?${params}`, {
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  // ── Penalidades ────────────────────────────────────────────────────────────

  async getPenalidades(userId, { ativas, page, limit } = {}) {
    const params = new URLSearchParams();
    if (ativas !== undefined) params.set('ativas', ativas);
    if (page) params.set('page', page);
    if (limit) params.set('limit', limit);
    const query = params.toString() ? `?${params}` : '';
    const res = await fetch(`${BASE_URL}/api/admin/usuarios/${userId}/penalidades${query}`, {
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  async applyPenalidade(userId, { pen_tipo, pen_duracao, pen_motivo }) {
    const res = await fetch(`${BASE_URL}/api/admin/usuarios/${userId}/penalidades`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ pen_tipo, pen_duracao, pen_motivo })
    });
    return handleResponse(res);
  },

  async removePenalidade(penId) {
    const res = await fetch(`${BASE_URL}/api/admin/penalidades/${penId}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    return handleResponse(res);
  }
};
