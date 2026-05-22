// ============================================================
// services/http.js — Cliente HTTP base do painel admin
//
// Centraliza a comunicação com a API de Caronas:
//   - Base URL via variável de ambiente (VITE_API_URL, ver .env)
//   - Injeta o Authorization: Bearer <access_token> em toda chamada
//   - Em caso de 401, tenta um refresh único antes de falhar
//   - Em caso de refresh inválido, dispara o evento 'auth:logout'
//     no window para que o AuthContext zere o estado da UI
//
// Esta camada é "burra" de propósito: não conhece endpoints
// específicos. O api.js consome este módulo para falar com a API.
// ============================================================

// import.meta.env.VITE_API_URL → variável definida no .env.
// Sem o prefixo VITE_ ela não é exposta ao bundle (regra do Vite).
const BASE_URL = (
  import.meta.env?.VITE_API_URL ?? "http://172.16.0.102:3000"
).replace(/\/+$/, "");

// Chaves usadas no localStorage. Centralizadas aqui para evitar
// strings espalhadas pelo código (typo-safe).
const ACCESS_KEY = "auth_token";
const REFRESH_KEY = "refresh_token";

// ApiError: erro tipado que carrega o status HTTP e o corpo da resposta.
// Permite que a UI decida o que fazer (ex: mostrar "Email não verificado"
// quando recebe 401 do login com mensagem específica).
export class ApiError extends Error {
  constructor(status, message, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

// Helper de tokens. Em vez de ler/escrever localStorage diretamente
// em vários arquivos, todos passam por aqui.
export const tokens = {
  get() {
    return {
      access: localStorage.getItem(ACCESS_KEY),
      refresh: localStorage.getItem(REFRESH_KEY),
    };
  },
  set({ access, refresh }) {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// Guard para evitar várias chamadas paralelas de refresh quando
// múltiplas requisições recebem 401 ao mesmo tempo.
let refreshInflight = null;

async function refreshTokens() {
  if (refreshInflight) return refreshInflight;
  const { refresh } = tokens.get();
  if (!refresh) {
    throw new ApiError(401, "Sessão expirada.");
  }
  refreshInflight = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/usuarios/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!res.ok) {
        tokens.clear();
        // Evento global: o AuthContext escuta e zera o estado.
        // Usar evento em vez de import direto evita acoplamento circular
        // (http.js NÃO precisa conhecer o AuthContext).
        window.dispatchEvent(
          new CustomEvent("auth:logout", {
            detail: { reason: "refresh-failed" },
          }),
        );
        throw new ApiError(res.status, "Sessão expirada.");
      }
      const data = await res.json();
      tokens.set({ access: data.access_token, refresh: data.refresh_token });
      return data;
    } finally {
      refreshInflight = null;
    }
  })();
  return refreshInflight;
}

// request: função principal — todas as chamadas passam por aqui.
//
// Parâmetros:
//   method   → 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
//   path     → caminho do endpoint, ex: '/api/usuarios/me'
//   options  → { body, headers, signal, auth, query }
//     body   → corpo da requisição (JSON ou FormData)
//     query  → objeto { chave: valor } convertido em ?chave=valor
//     auth   → default true; envia Authorization
//     signal → AbortController.signal (cancela a request)
async function request(method, path, options = {}) {
  const { body, headers, signal, query, auth = true, _retry = false } = options;

  // Monta a URL final. Aceita path absoluto (raro) ou relativo à BASE_URL.
  let url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  if (query && typeof query === "object") {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") qs.set(k, v);
    }
    const s = qs.toString();
    if (s) url += (url.includes("?") ? "&" : "?") + s;
  }

  const isForm = body instanceof FormData;
  const init = {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined && !isForm
        ? { "Content-Type": "application/json" }
        : {}),
      ...(headers ?? {}),
    },
    signal,
  };

  if (auth) {
    const { access } = tokens.get();
    if (access) init.headers.Authorization = `Bearer ${access}`;
  }

  if (body !== undefined) {
    init.body = isForm ? body : JSON.stringify(body);
  }

  const res = await fetch(url, init);

  // Tenta um refresh único quando o access expirou.
  if (res.status === 401 && auth && !_retry) {
    try {
      await refreshTokens();
      return request(method, path, { ...options, _retry: true });
    } catch {
      // Cai no tratamento de erro abaixo com a resposta original.
    }
  }

  if (res.status === 204) return null;

  const text = await res.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const message =
      (payload &&
        typeof payload === "object" &&
        (payload.error || payload.message)) ||
      (typeof payload === "string" && payload) ||
      `Erro ${res.status}`;
    throw new ApiError(res.status, message, payload);
  }

  return payload;
}

// Atalhos por verbo HTTP. Mantém o site-call mais legível
// (http.get('/api/x') em vez de request('GET', '/api/x')).
export const http = {
  get: (path, options) => request("GET", path, options),
  post: (path, body, options) => request("POST", path, { ...options, body }),
  put: (path, body, options) => request("PUT", path, { ...options, body }),
  patch: (path, body, options) => request("PATCH", path, { ...options, body }),
  del: (path, options) => request("DELETE", path, options),
};

export { BASE_URL };
