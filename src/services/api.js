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
  // Auth
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

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
  },

  // Escolas (Instituições)
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

  // Usuários/Administradores
  async searchUsers(query) {
    const params = new URLSearchParams({ q: query, limit: 10 });
    const res = await fetch(`${BASE_URL}/api/admin/usuarios?${params}`, {
      headers: authHeaders()
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

  // Penalidades
  async getPenalidades(userId, { ativas, page, limit } = {}) {
    const params = new URLSearchParams();
    if (ativas !== undefined) params.set('ativas', ativas);
    if (page)  params.set('page', page);
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
