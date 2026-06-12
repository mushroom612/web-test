// ============================================================
// services/api.js — Serviço de comunicação com a API
//
// Camada única de acesso à API para todos os componentes.
// Todos os métodos fazem chamadas HTTP reais via http.js,
// que injeta o Authorization Bearer e lida com refresh de token.
//
// Endpoints reais: ver services/http.js + documentação da API.
// ============================================================

import { http, tokens } from './http';

// statsCache: cache em memória das estatísticas por tipo.
// TTL de 5 min evita refetch desnecessário ao navegar entre
// Dashboard e Relatórios, que fazem as mesmas 3 chamadas.
const statsCache = {};
const STATS_TTL_MS = 5 * 60 * 1000;

// api: objeto exportado com todos os métodos da aplicação.
// Os componentes importam este objeto e chamam seus métodos:
//   import { api } from '../services/api'
//   await api.login(email, senha)
export const api = {

  // ── Autenticação (REAL — fala com a API) ──────────────────
  // Endpoints: POST /api/usuarios/login, GET /api/usuarios/me,
  //            POST /api/usuarios/logout.

  // login: autentica o usuário contra a API.
  // Resposta esperada: { access_token, refresh_token, user }.
  // Os tokens são salvos via helper de http.js (localStorage).
  async login(email, senha) {
    const data = await http.post(
      '/api/usuarios/login',
      { usu_email: email, usu_senha: senha },
      { auth: false } // login não envia Authorization
    );
    tokens.set({
      access: data.access_token,
      refresh: data.refresh_token
    });
    return data;
  },

  // getMe: retorna o perfil do usuário autenticado.
  // A API expõe GET /api/usuarios/me como atalho para perfil/{id}.
  // O backend envelopa em { user: ... }; achatamos para o caller
  // não precisar saber dessa diferença.
  async getMe() {
    const data = await http.get('/api/usuarios/me');
    return data?.user ?? data;
  },

  // logout: invalida o refresh token no backend (best-effort)
  // e limpa as credenciais locais. Mesmo se o POST falhar
  // (rede caída, token já expirado), a sessão local é encerrada.
  async logout() {
    try {
      await http.post('/api/usuarios/logout');
    } catch {
      // ignora: o objetivo prioritário é encerrar a sessão local
    }
    tokens.clear();
  },

  // ── Recuperação de senha ──────────────────────────────
  // Envia OTP de 6 dígitos para o email. Sempre retorna 200
  // para não revelar se o email existe na base.
  async forgotPassword(email) {
    return http.post(
      '/api/usuarios/forgot-password',
      { usu_email: email },
      { auth: false }
    );
  },

  // Valida o OTP antes de liberar a tela de nova senha.
  // 200 → válido | 401 → inválido | 410 → expirado
  async verificarOtpReset(email, otp) {
    return http.post(
      '/api/usuarios/reset-password/verificar-otp',
      { usu_email: email, otp },
      { auth: false }
    );
  },

  // Redefine a senha com OTP válido (mín. 8 caracteres).
  async resetPassword(email, otp, novaSenha) {
    return http.post(
      '/api/usuarios/reset-password',
      { usu_email: email, otp, nova_senha: novaSenha },
      { auth: false }
    );
  },

  // ── Suporte (chat Admin ↔ Desenvolvedor)  [v30] ───────────
  // No backend real, o remetente e o escopo vêm do JWT; por isso os
  // parâmetros `admin`/`role` abaixo são apenas dicas para o mock e
  // somem na versão HTTP.

  // Admin: thread da própria conversa de suporte.
  async getMinhaThreadSuporte() {
    return http.get('/api/admin/suporte/mensagens');
  },

  // Admin: envia mensagem ao Dev.
  async enviarMensagemSuporte(texto) {
    return http.post('/api/admin/suporte/mensagens', { spm_texto: texto });
  },

  // Dev: lista de conversas (uma por admin) com prévia e não lidas.
  async getConversasSuporte() {
    return http.get('/api/dev/suporte/conversas');
  },

  // Dev: thread de um admin específico.
  async getThreadSuporte(usuId) {
    return http.get('/api/admin/suporte/mensagens', { query: { usu_id: usuId } });
  },

  // Dev: responde a um admin.
  async responderSuporte(usuId, texto) {
    return http.post('/api/admin/suporte/mensagens', { usu_id: usuId, spm_texto: texto });
  },

  // Badge de não lidas (Admin ou Dev).
  async getNaoLidasSuporte() {
    return http.get('/api/admin/suporte/nao-lidas');
  },

  // Marca como lidas — Dev: { usuId }; Admin: ignorado (backend infere pelo JWT).
  async marcarLidasSuporte({ usuId } = {}) {
    return http.post('/api/admin/suporte/mensagens/lidas', usuId ? { usu_id: usuId } : {});
  },

  // ── Estatísticas (Dashboard) ───────────────────────────────
  // Endpoints reais: GET /api/admin/stats/{usuarios,caronas,sugestoes}
  // O backend já filtra por escola quando per_tipo=1 (Admin) e devolve
  // dados globais quando per_tipo=2 (Dev). O front não precisa passar
  // esc_id — o middleware adminGuard usa o do JWT.
  //
  // Shapes (retornadas pelo AdminController):
  //   usuarios → { total, ativos, inativos, aguardando_otp,
  //                acesso_temporario, acesso_temporario_com_veiculo,
  //                matricula_verificada, completos, suspensos }
  //   caronas  → { total, abertas, em_espera, finalizadas, canceladas }
  //   sugestoes→ { total, abertas, em_analise, fechadas,
  //                denuncias, sugestoes }
  // Todas envelopadas em { message, stats }.
  async getStats(type, params = {}) {
    const validTypes = ['usuarios', 'caronas', 'sugestoes'];
    if (!validTypes.includes(type)) {
      throw new Error(`Tipo de estatística inválido: ${type}`);
    }
    // Remove keys vazios/nulos para não poluir a query string
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v != null && v !== '')
    );
    const hasFilters = Object.keys(cleanParams).length > 0;

    if (!hasFilters) {
      // Sem filtros: usa cache de 5 min
      const now = Date.now();
      if (statsCache[type] && now - statsCache[type].ts < STATS_TTL_MS) {
        return statsCache[type].data;
      }
      const result = await http.get(`/api/admin/stats/${type}`);
      statsCache[type] = { data: result, ts: now };
      return result;
    }
    // Com filtros: bypass cache, envia params como query string
    return http.get(`/api/admin/stats/${type}`, { query: cleanParams });
  },

  // ── Escolas ─────────────────────────────────────────────────
  // Todos os endpoints de escolas são Dev-only (/api/dev/escolas).
  // A resposta inclui dados de contrato (esc_contrato_duracao, etc.).

  // Endpoint: GET /api/dev/escolas?q=&status_contrato=
  // Retorna todas as escolas com dados de contrato para listagem.
  async getSchools() {
    return http.get('/api/dev/escolas');
  },

  // Endpoint: POST /api/dev/escolas
  // Body: { esc_nome, esc_endereco, esc_dominio?, esc_max_usuarios? }
  async createSchool(data) {
    return http.post('/api/dev/escolas', data);
  },

  // Endpoint: PUT /api/dev/escolas/:id
  async updateSchool(id, data) {
    return http.put(`/api/dev/escolas/${id}`, data);
  },

  // Endpoint: DELETE /api/dev/escolas/:id  (204 No Content)
  // Só funciona se não houver cursos vinculados.
  async deleteSchool(id) {
    return http.del(`/api/dev/escolas/${id}`);
  },

  // getMyContract: retorna os dados do contrato da escola do Admin logado.
  // Endpoint: GET /api/admin/contrato  (Admin only)
  // Shape: { contrato: { esc_id, esc_nome, esc_dominio, esc_max_usuarios,
  //           esc_contrato_duracao, esc_contrato_inicio, esc_contrato_expira,
  //           dias_restantes, status_contrato } }
  async getMyContract() {
    return http.get('/api/admin/contrato');
  },

  // uploadOcrTemplate: envia o PDF de template OCR de matrícula para uma escola.
  // Endpoint: POST /api/dev/escolas/:id/ocr-base  (multipart/form-data, campo 'ocr_base')
  // O arquivo é salvo em /public/ocr-base/ e o caminho é gravado em esc_ocr_base.
  async uploadOcrTemplate(escId, file) {
    const form = new FormData();
    form.append('ocr_base', file);
    return http.post(`/api/dev/escolas/${escId}/ocr-base`, form);
  },

  // uploadContractFile: envia o PDF do contrato.
  // Endpoint: POST /api/dev/escolas/:id/contrato/arquivo  (multipart/form-data)
  // O arquivo é salvo em /public/contratos/ e o caminho é gravado em esc_contrato_arquivo.
  async uploadContractFile(escId, file) {
    const form = new FormData();
    form.append('contrato', file);
    return http.post(`/api/dev/escolas/${escId}/contrato/arquivo`, form);
  },

  // Endpoint: POST /api/dev/escolas/:id/contrato
  // Body: { duracao: '1ano'|'2anos'|'5anos', data_inicio?: 'YYYY-MM-DD' }
  // Define ou renova o contrato de uma escola após ela ser criada.
  async createContract(escId, { duracao, data_inicio }) {
    return http.post(`/api/dev/escolas/${escId}/contrato`, {
      duracao,
      ...(data_inicio ? { data_inicio } : {})
    });
  },

  // ── Geocodificação de endereço ────────────────────────────
  // Endpoint: GET /api/pontos/geocode?q=<texto>&limite=<n>
  // Utiliza Nominatim (OpenStreetMap) para sugestões de endereço.
  // Mínimo de 3 caracteres; rate limit: 20 req/min.
  // Shape da resposta: array de { display_name, lat, lon, ... }
  async geocodeAddress(q, limite = 5) {
    return http.get('/api/pontos/geocode', { query: { q, limite } });
  },

  // ── Usuários (criação — Dev only) ─────────────────────────
  // Endpoint: POST /api/dev/cadastrar
  // Cria conta de Admin (per_tipo=1) ou Dev (per_tipo=2) sem fluxo de OTP.
  // Usado por Cadastrar.jsx para criar o admin de uma nova instituição.
  async createUser({ usu_nome, usu_email, usu_senha, usu_telefone, per_tipo, per_escola_id }) {
    return http.post('/api/dev/cadastrar', {
      usu_nome,
      usu_email,
      usu_senha,
      ...(usu_telefone ? { usu_telefone } : {}),
      per_tipo: per_tipo ?? 1,
      ...(per_escola_id ? { per_escola_id } : {})
    });
  },

  // ── Usuários (Admin) ───────────────────────────────────────
  // Endpoint: GET /api/admin/usuarios?q=&page=&limit=
  // Admin: retorna apenas usuários da sua instituição (backend filtra via JWT).
  // Dev:   retorna todos os usuários da plataforma.
  // Shape: { message, totalGeral, total, page, limit,
  //          usuarios: [{ usu_id, usu_nome, usu_email, usu_status,
  //                       usu_verificacao, esc_nome, cur_nome, per_tipo }] }
  async getUsers({ page = 1, limit = 50, q = '', esc_id } = {}) {
    return http.get('/api/admin/usuarios', {
      query: { page, limit, ...(q ? { q } : {}), ...(esc_id ? { esc_id } : {}) }
    });
  },

  // Endpoint: GET /api/admin/usuarios/:id
  // Retorna dados completos do usuário (inclui escola, curso, penalidades ativas).
  async getUser(userId) {
    return http.get(`/api/admin/usuarios/${userId}`);
  },

  // Endpoint: PATCH /api/admin/usuarios/:id/status
  // Ativa (usu_status=1) ou desativa (usu_status=0) a conta.
  async updateUserStatus(userId, status) {
    return http.patch(`/api/admin/usuarios/${userId}/status`, { usu_status: status });
  },

  // updateUser: atualiza nome/telefone do usuário E/OU seu status.
  // Usado por UserProfilePanel ao salvar o formulário de edição.
  //
  // Status → PATCH /api/admin/usuarios/:id/status (Admin endpoint, sempre funciona)
  // Nome/telefone → PUT /api/usuarios/:id (best-effort: pode ser restrito a conta própria)
  async updateUser(userId, { usu_nome, usu_telefone, usu_status } = {}) {
    if (usu_status !== undefined) {
      await http.patch(`/api/admin/usuarios/${userId}/status`, { usu_status: Number(usu_status) });
    }
    if (usu_nome !== undefined || usu_telefone !== undefined) {
      const body = {};
      if (usu_nome !== undefined) body.usu_nome = usu_nome;
      if (usu_telefone !== undefined) body.usu_telefone = usu_telefone;
      try {
        await http.put(`/api/usuarios/${userId}`, body);
      } catch { /* backend pode restringir edição de perfil alheio */ }
    }
    return { usu_id: userId, usu_nome, usu_telefone, usu_status };
  },

  // updateUserProfile: vincula um usuário a uma escola e define seu papel.
  // Endpoint: PUT /api/dev/usuarios/:id/perfil  { per_tipo, per_escola_id }
  // Usado por Cadastrar.jsx após criar a escola para linkar o admin.
  async updateUserProfile(userId, profileData) {
    return http.put(`/api/dev/usuarios/${userId}/perfil`, profileData);
  },

  // Alias mantido para compatibilidade.
  async searchUsers(query) {
    return this.getUsers({ q: query });
  },

  // ── Caronas ────────────────────────────────────────────────
  // Endpoints reais:
  //   GET /api/admin/caronas — lista (Admin: própria escola; Dev: todas)
  //   GET /api/caronas/{id}/resumo — detalhe (origem, destino, passageiros)
  //
  // O endpoint de lista é minimalista (não retorna pontos nem passageiros);
  // por isso há um segundo método getCaronaResumo() chamado on-click para
  // popular o painel de detalhe.

  // getCaronas: lista paginada com filtros opcionais.
  //   status: 0=Cancelada, 1=Aberta, 2=Em espera, 3=Finalizada
  //   data_inicio / data_fim: YYYY-MM-DD
  //   esc_id: apenas Dev (Admin é forçado à própria escola)
  //
  // Shape:
  //   { message, totalGeral, total, page, limit, esc_id,
  //     caronas: [{ car_id, car_data, car_hor_saida, car_vagas_dispo,
  //                 car_status, car_desc, motorista_id, motorista,
  //                 motorista_email, vei_placa, vei_tipo }] }
  async getCaronas({ status, page, limit, esc_id, data_inicio, data_fim } = {}) {
    return http.get('/api/admin/caronas', {
      query: { status, page, limit, esc_id, data_inicio, data_fim }
    });
  },

  // getCaronaResumo: detalhe completo de uma carona (origem, destino,
  // passageiros, veículo, avaliações). Disparado quando o usuário
  // seleciona um card da lista no painel admin.
  //
  // Shape:
  //   { message,
  //     carona: { car_id, car_desc, car_data, car_hor_saida, car_vagas_dispo,
  //               car_status, vei_marca_modelo, vei_placa, vei_tipo,
  //               vei_cor, vei_vagas, motorista_id, motorista, ... },
  //     pontos: [{ pon_id, pon_nome, pon_endereco, pon_tipo, ... }],
  //     passageiros: [{ usu_id, usu_nome, usu_foto, origem }],
  //     avaliacoes: [...],
  //     minha_solicitacao: null }
  async getCaronaResumo(carId) {
    if (!carId) throw new Error('ID da carona é obrigatório.');
    return http.get(`/api/caronas/${carId}/resumo`);
  },

  // ── Sugestões (apenas Desenvolvedor) ─────────────────────────
  // Endpoint: GET /api/sugestoes  (per_tipo=2 obrigatório)
  // Shape: { message, totalGeral, total, page, limit,
  //          sugestoes: [{ sug_id, sug_texto, sug_data, sug_status,
  //                        sug_resposta, autor }] }
  // sug_status: 0=Fechado(Resolvido) 1=Aberto(Pendente) 2=Arquivado 3=Em análise
  async getSugestoes({ page, limit } = {}) {
    return http.get('/api/sugestoes', { query: { page, limit } });
  },

  // Marca uma sugestão como "Em análise" — PUT /api/sugestoes/:id/analisar
  async analisarSugestao(sugId) {
    return http.put(`/api/sugestoes/${sugId}/analisar`);
  },

  // Responde e fecha a sugestão — PUT /api/sugestoes/:id/responder
  // Body esperado: { sug_resposta }
  async responderSugestao(sugId, resposta) {
    return http.put(`/api/sugestoes/${sugId}/responder`, { sug_resposta: resposta });
  },

  // Arquiva a sugestão — POST /api/sugestoes/:id/arquivar
  async arquivarSugestao(sugId) {
    return http.post(`/api/sugestoes/${sugId}/arquivar`);
  },

  // ── Denúncias (Administrador + Desenvolvedor) ─────────────────
  // Endpoint: GET /api/denuncias
  // Admin: escopo automático à sua escola (backend filtra via JWT)
  // Dev:   acesso a todas as denúncias
  // Shape: { message, totalGeral, total, page, limit,
  //          denuncias: [{ den_id, den_tipo, den_motivo, den_texto,
  //                        den_data, den_status, den_resposta,
  //                        denunciante, usuario_alvo, car_id, den_usu_alvo }] }
  // den_tipo:   0=Denúncia de carona  1=Denúncia de usuário
  // den_status: 0=Fechado(Resolvido)  1=Aberto(Pendente)  2=Arquivado  3=Em análise
  async getDenuncias({ page, limit } = {}) {
    return http.get('/api/denuncias', { query: { page, limit } });
  },

  // Marca uma denúncia como "Em análise" — PUT /api/denuncias/:id/analisar
  async analisarDenuncia(denId) {
    return http.put(`/api/denuncias/${denId}/analisar`);
  },

  // Responde e fecha a denúncia — PUT /api/denuncias/:id/responder
  // Body esperado: { den_resposta }
  async responderDenuncia(denId, resposta) {
    return http.put(`/api/denuncias/${denId}/responder`, { den_resposta: resposta });
  },

  // Arquiva a denúncia — POST /api/denuncias/:id/arquivar
  async arquivarDenuncia(denId) {
    return http.post(`/api/denuncias/${denId}/arquivar`);
  },

  // Exclui (soft delete) uma sugestão — DELETE /api/sugestoes/:id
  // Apenas Desenvolvedor (per_tipo=2) tem permissão.
  // Resposta esperada: 204 No Content (http.js retorna null).
  async deleteSugestao(sugId) {
    return http.del(`/api/sugestoes/${sugId}`);
  },

  // Exclui (soft delete) uma denúncia — DELETE /api/denuncias/:id
  // Apenas Desenvolvedor (per_tipo=2) tem permissão.
  async deleteDenuncia(denId) {
    return http.del(`/api/denuncias/${denId}`);
  },

  // ── Notificações ───────────────────────────────────────────
  // enviarNotificacao: despacha para o endpoint correto conforme o destinatário.
  //
  // usu_id preenchido → POST /api/notificacoes/enviar  (usuário específico)
  //   Body: { usu_id, noti_titulo, noti_descricao }
  //
  // usu_id ausente → POST /api/admin/notificacoes/escola  (broadcast à escola do Admin)
  //   Body: { noti_titulo, noti_descricao }
  //   Acesso: Admin only (backend usa per_escola_id do JWT para escopo).
  async enviarNotificacao({ titulo, mensagem, usu_id } = {}) {
    if (usu_id) {
      return http.post('/api/notificacoes/enviar', {
        usu_id,
        noti_titulo:    titulo,
        noti_descricao: mensagem
      });
    }
    return http.post('/api/admin/notificacoes/escola', {
      noti_titulo:    titulo,
      noti_descricao: mensagem
    });
  },

  // ── Logs de Auditoria (apenas Desenvolvedor) ───────────────
  // Endpoint: GET /api/dev/logs?acao=&data_inicio=&data_fim=&page=&limit=
  // Somente usuários com per_tipo = 2 (Desenvolvedor) têm acesso.
  // Shape: { logs: [{ audit_id, criado_em, usu_id, acao, tabela, registro_id, ip }],
  //          totalGeral, page, limit }
  //
  // Nota: os parâmetros de data usam snake_case (data_inicio / data_fim),
  // diferente do que estava na versão mockada (dataInicio / dataFim).
  async getLogs({ page = 1, limit = 20, acao, dataInicio, dataFim } = {}) {
    return http.get('/api/dev/logs', {
      query: {
        page,
        limit,
        ...(acao       ? { acao }                    : {}),
        ...(dataInicio ? { data_inicio: dataInicio }  : {}),
        ...(dataFim    ? { data_fim:    dataFim }     : {})
      }
    });
  },

  // Endpoint: GET /api/dev/logs/exportar?acao=&data_inicio=&data_fim=&usu_id=
  // Retorna CSV bruto (até 10 000 registros). O http.js devolve o texto CSV
  // como string (JSON.parse falha → fallback para texto puro).
  // O componente cria um Blob e dispara o download.
  async exportLogs({ acao, dataInicio, dataFim } = {}) {
    const csvText = await http.get('/api/dev/logs/exportar', {
      query: {
        ...(acao       ? { acao }                    : {}),
        ...(dataInicio ? { data_inicio: dataInicio }  : {}),
        ...(dataFim    ? { data_fim:    dataFim }     : {})
      }
    });

    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true };
  },

  // ── Penalidades ────────────────────────────────────────────
  // Endpoint: GET /api/admin/usuarios/:id/penalidades?ativas=1
  // Retorna o histórico de penalidades do usuário.
  // ativas=1 → filtra apenas penalidades ativas (omitir = todas).
  // Shape: { penalidades: [{ pen_id, pen_tipo, pen_motivo, pen_duracao,
  //                          pen_aplicado_em, pen_expira_em, pen_ativo }] }
  async getPenalidades(userId, { ativas, page, limit } = {}) {
    return http.get(`/api/admin/usuarios/${userId}/penalidades`, {
      query: {
        ...(ativas ? { ativas: 1 } : {}),
        ...(page ? { page } : {}),
        ...(limit ? { limit } : {})
      }
    });
  },

  // Endpoint: POST /api/admin/usuarios/:id/penalidades
  // Body: { pen_tipo, pen_duracao, pen_motivo? }
  async applyPenalidade(userId, { pen_tipo, pen_duracao, pen_motivo }) {
    return http.post(`/api/admin/usuarios/${userId}/penalidades`, {
      pen_tipo,
      ...(pen_duracao ? { pen_duracao } : {}),
      ...(pen_motivo ? { pen_motivo } : {})
    });
  },

  // Endpoint: DELETE /api/admin/penalidades/:id  (204 No Content)
  async removePenalidade(penId) {
    return http.del(`/api/admin/penalidades/${penId}`);
  },

  // ── Cursos ─────────────────────────────────────────────────

  // getCourses: busca cursos de uma escola específica (ou todos para Admin/Dev).
  //
  // Com escId → GET /api/infra/escolas/:id/cursos  (público, sem auth)
  //   Usado por Cadastrar.jsx no lazy loading de cursos por instituição.
  // Sem escId → GET /api/admin/cursos  (Admin: escola própria; Dev: todos)
  //   Usado por Relatorios.jsx para popular o filtro de cursos.
  async getCourses(escId) {
    if (escId != null) {
      return http.get(`/api/infra/escolas/${escId}/cursos`);
    }
    return http.get('/api/admin/cursos');
  },

  // Endpoint: POST /api/dev/escolas/:id/cursos
  // Body: { cur_nome, cur_semestre? }
  // O esc_id é passado na URL (não no body).
  async createCourse({ esc_id, cur_nome, cur_semestres, cur_descricao }) {
    return http.post(`/api/dev/escolas/${esc_id}/cursos`, {
      cur_nome,
      ...(cur_semestres ? { cur_semestre: cur_semestres } : {}),
      ...(cur_descricao ? { cur_descricao } : {})
    });
  },

  // Endpoint: PUT /api/dev/cursos/:id
  // Body: { cur_nome?, cur_semestre? }
  async updateCourse(id, { cur_nome, cur_semestres, cur_descricao }) {
    return http.put(`/api/dev/cursos/${id}`, {
      ...(cur_nome ? { cur_nome } : {}),
      ...(cur_semestres ? { cur_semestre: cur_semestres } : {}),
      ...(cur_descricao !== undefined ? { cur_descricao } : {})
    });
  },

  // Endpoint: DELETE /api/dev/cursos/:id  (204 No Content)
  // Só funciona se não houver matrículas ativas no curso.
  async deleteCourse(id) {
    return http.del(`/api/dev/cursos/${id}`);
  },

  // ── Relatórios ─────────────────────────────────────────────
  // Os endpoints de relatório retornam CSV bruto quando ?formato=csv é enviado.
  // O http.js tenta JSON.parse e, ao falhar, retorna o texto bruto (string).
  // O componente cria um Blob a partir dessa string e dispara o download.

  // Endpoint: GET /api/admin/relatorios/caronas?formato=csv&inicio=&fim=&esc_id=
  // Acesso: Admin + Dev.
  //   Admin: esc_id é ignorado (backend usa per_escola_id do JWT automaticamente).
  //   Dev:   esc_id opcional — sem ele retorna todas as escolas; com ele filtra uma.
  // CSV: periodo_inicio, periodo_fim, total, abertas, em_espera, finalizadas, canceladas
  async downloadRelatorioCaronas({ inicio, fim, esc_id } = {}) {
    return http.get('/api/admin/relatorios/caronas', {
      query: {
        formato: 'csv',
        ...(inicio  ? { inicio }  : {}),
        ...(fim     ? { fim }     : {}),
        ...(esc_id  ? { esc_id }  : {})
      }
    });
  },

  // Endpoint: GET /api/dev/relatorios/usuarios?formato=csv&esc_id=&status=&verificacao=
  // Acesso: Dev only. CSV: usu_id, usu_nome, usu_email, usu_status, usu_verificacao, ...
  async downloadRelatorioUsuarios({ esc_id, status, verificacao } = {}) {
    return http.get('/api/dev/relatorios/usuarios', {
      query: {
        formato: 'csv',
        ...(esc_id      ? { esc_id }      : {}),
        ...(status      != null ? { status }      : {}),
        ...(verificacao != null ? { verificacao }  : {})
      }
    });
  },

  // Endpoint: GET /api/dev/relatorios/penalidades?formato=csv&esc_id=&pen_tipo=&ativo=
  // Acesso: Dev only. CSV: pen_id, usu_id, usu_nome, usu_email, pen_tipo, pen_motivo, ...
  async downloadRelatorioPenalidades({ esc_id, pen_tipo, ativo } = {}) {
    return http.get('/api/dev/relatorios/penalidades', {
      query: {
        formato: 'csv',
        ...(esc_id   ? { esc_id }  : {}),
        ...(pen_tipo ? { pen_tipo } : {}),
        ...(ativo != null ? { ativo } : {})
      }
    });
  },

  // Endpoint: GET /api/admin/relatorios/atividade?dias=30
  // Acesso: Admin + Dev. Retorna JSON (sem suporte a CSV).
  // Shape: { caronas, usuarios, avaliacoes, periodo }
  async getRelatorioAtividade({ dias } = {}) {
    return http.get('/api/admin/relatorios/atividade', {
      query: { ...(dias ? { dias } : {}) }
    });
  }
};
