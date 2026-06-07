// ============================================================
// pages/Sugestoes.jsx — Página de sugestões e denúncias
//
// Gerencia os feedbacks enviados pelos usuários: sugestões de
// melhoria e denúncias de problemas/comportamentos inadequados.
// Usa layout mestre-detalhe igual à página de Caronas.
//
// Funcionalidades:
//   - Filtros por tipo (Todos / Sugestão / Denúncia / Arquivados)
//   - Cards de resumo (sugestões, denúncias, pendentes, resolvidos)
//   - Painel de detalhe com: status, resposta, arquivar
//   - Responder ao usuário via textarea
//   - Alterar status: Pendente → Em análise → Resolvido
//   - Arquivar itens sem excluí-los (persiste na API)
//   - Aplicar penalidade ao usuário denunciado (abre PenaltyPanel)
//   - Navegar para a carona vinculada (abre /caronas?id=N)
//   - Auto-seleção via URL (?id=N) quando navegado do Dashboard
//
// RBAC (controle por papel):
//   Admin (per_tipo=1) → vê só Denúncias da sua instituição.
//                        O backend filtra o escopo via JWT.
//   Dev (per_tipo=2)   → vê Sugestões + Denúncias de todas as
//                        instituições (busca paralela).
//
// Alteração de API (endpoints separados):
//   Anteriormente havia um único GET /api/sugestoes retornando
//   ambos os tipos via sug_tipo. Agora são dois endpoints distintos:
//     GET /api/sugestoes  → apenas sugestões (Dev only)
//     GET /api/denuncias  → apenas denúncias (Admin + Dev)
//   Por isso foram criadas as funções de normalização sugestaoToItem
//   e denunciaToItem, que convertem cada formato para um shape interno
//   unificado consumido por toda a UI.
//
// Mapeamento de status corrigido (ambos os endpoints):
//   API: 0=Fechado  1=Aberto  2=Arquivado  3=Em análise
//   UI:  Resolvido  Pendente  (via archivedIds)  Em análise
//   O código anterior mapeava 1→Resolvido e 2→Em análise (errado).
//
// Componente filho: PenaltyPanel
//
// Estilo: Sugestoes.module.css
//   Classes principais:
//     .container            → área da página
//     .header               → cabeçalho
//     .statsRow / .statCard → resumo numérico por categoria
//     .statIconBlue/Red/Yellow/Green → cores dos ícones dos cards
//     .filterTabs / .filterBtn / .active → barra de filtros
//     .filterDivider        → separador visual na barra de filtros
//     .layout / .layoutWithDetail → layout mestre-detalhe
//     .listPanel            → painel esquerdo (lista)
//     .listCard             → card de cada item
//     .listCardDenuncia / .listCardSugestao → borda lateral colorida
//     .listCardSelected     → destaque do item selecionado
//     .listCardArchived     → visual desbotado de arquivado
//     .avatar / .avatarDenuncia / .avatarSugestao → avatar do remetente
//     .typeBadge / .typeDenuncia / .typeSugestao → badge de tipo
//     .statusPill / .status_Pendente / .status_Em_análise / .status_Resolvido
//     .urgentTag / .repliedTag → tags de atenção e respondido
//     .detailPanel          → painel direito (detalhe)
//     .denunciaContext      → bloco de contexto de denúncia
//     .penalizeBtn / .viewRideBtn → botões de ação em denúncias
//     .replyInput / .sendBtn → área de resposta
//     .archiveBtn / .unarchiveBtn → ações de arquivar/restaurar
//     .archiveBanner        → aviso na visualização de arquivados
//     .loadingWrap / .spin  → spinner
//     .emptyState           → estado vazio da lista
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
// useAuth: adicionado para leitura do papel (isAdmin) e aplicação de RBAC.
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Send, MessageSquare, Archive, Trash2,
  Loader2, AlertTriangle, CheckCircle, Clock,
  Flag, ShieldAlert, User, ChevronRight, X,
  CornerDownRight, Info, Car
} from 'lucide-react';
import { PenaltyPanel } from '../components/PenaltyPanel';
import styles from './Sugestoes.module.css';

// mapStatus: converte o código numérico da API para o texto exibido na UI.
//
// Correção de mapeamento — o código anterior estava invertido:
//   Antes: 1→'Resolvido', 2→'Em análise', 0→'Pendente'  ← ERRADO
//   Agora: 0→'Resolvido', 1→'Pendente',   3→'Em análise' ← CORRETO
//
// Status 2 (Arquivado) é tratado separadamente: itens com sug_status/
// den_status === 2 populam o archivedIds no useEffect, e não chegam
// a ser mapeados por esta função para a lista principal.
function mapStatus(code) {
  if (code === 3) return 'Em análise';
  if (code === 0) return 'Resolvido';
  return 'Pendente'; // 1 = Aberto (e fallback para valores desconhecidos)
}

// formatDate: formata uma string de data/hora para o padrão brasileiro.
// Centralizado aqui para não duplicar em sugestaoToItem e denunciaToItem.
function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// sugestaoToItem: normaliza uma sugestão vinda de GET /api/sugestoes
// para o formato interno unificado usado pela UI.
//
// Campos da API: sug_id, sug_texto, sug_data, sug_status,
//               sug_resposta, autor
//
// id usa prefixo composto "sug-N" para evitar colisão com denúncias que
// têm seu próprio sequence de den_id (ambos começam em 1).
// _id guarda o numérico original para as chamadas de API.
function sugestaoToItem(s) {
  const nome = s.autor || 'Usuário';
  return {
    id:              `sug-${s.sug_id}`,  // chave interna única — sem colisão com den_id
    _id:             s.sug_id,           // ID numérico original para chamadas de API
    _tipo:           'sugestao',         // identifica qual endpoint chamar nas ações
    userId:          s.usu_id ?? null,
    userName:        nome,
    avatar:          nome.charAt(0).toUpperCase(),
    date:            formatDate(s.sug_data),
    type:            'Sugestão',
    motivo:          null,         // só denúncias possuem motivo
    text:            s.sug_texto,
    status:          mapStatus(s.sug_status),
    archived:        s.sug_status === 2, // pré-população do archivedIds no useEffect
    response:        s.sug_resposta || null,
    caronaId:        null,
    usuarioAlvoId:   null,
    usuarioAlvoNome: null,
  };
}

// denunciaToItem: normaliza uma denúncia vinda de GET /api/denuncias
// para o formato interno unificado usado pela UI.
//
// Campos da API: den_id, den_tipo, den_motivo, den_texto, den_data,
//               den_status, den_resposta, denunciante, usuario_alvo,
//               car_id, den_usu_alvo
//
// Diferenças de shape em relação à sugestão:
//   motivo        → den_motivo (obrigatório, 3–100 chars)
//   text          → den_texto (opcional, até 500 chars)
//   usuarioAlvoId → den_usu_alvo (ID para aplicar penalidade)
//   usuarioAlvoNome → usuario_alvo (nome exibido no contexto)
//   caronaId      → car_id (link para navegar até a carona)
function denunciaToItem(d) {
  const nome = d.denunciante || 'Usuário';
  return {
    id:              `den-${d.den_id}`,  // chave interna única — sem colisão com sug_id
    _id:             d.den_id,           // ID numérico original para chamadas de API
    _tipo:           'denuncia',
    userId:          d.usu_id ?? null,
    userName:        nome,
    avatar:          nome.charAt(0).toUpperCase(),
    date:            formatDate(d.den_data),
    type:            'Denúncia',
    motivo:          d.den_motivo || null,
    text:            d.den_texto || null,  // null quando não há descrição adicional
    status:          mapStatus(d.den_status),
    archived:        d.den_status === 2,
    response:        d.den_resposta || null,
    caronaId:        d.car_id || null,
    usuarioAlvoId:   d.den_usu_alvo || null,
    usuarioAlvoNome: d.usuario_alvo || null,
  };
}

// STATUS_OPTIONS: opções de status que o admin/dev pode definir para um item
const STATUS_OPTIONS = ['Pendente', 'Em análise', 'Resolvido'];

// STATUS_ICONS: mapeia cada status para seu ícone correspondente
const STATUS_ICONS = {
  'Pendente':   Clock,
  'Em análise': Info,
  'Resolvido':  CheckCircle
};

export function Sugestoes() {
  // isAdmin / isDev: derivados do JWT via AuthContext.
  // isAdmin → controla endpoints, filtros, cards e título da página.
  // isDev   → habilita o botão de exclusão permanente no painel de detalhe.
  const { isAdmin, isDev } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado inicial do filtro depende do papel:
  // Admin começa em 'Denúncia' (único tipo visível para ele).
  // Dev começa em 'Todos'.
  const [filterType, setFilterType] = useState(isAdmin ? 'Denúncia' : 'Todos');

  const [selectedId, setSelectedId] = useState(null);     // item selecionado no detalhe
  const [responseText, setResponseText] = useState('');   // texto da resposta digitada

  // archivedIds: Set de IDs arquivados.
  // Inicializado no useEffect com itens que já chegam arquivados da API
  // (status === 2), e atualizado pelo handleArchive / handleUnarchive.
  const [archivedIds, setArchivedIds] = useState(new Set());

  // statusMap: sobrescreve o status de itens localmente sem precisar
  // recarregar toda a lista da API após uma mudança de status.
  const [statusMap, setStatusMap] = useState({});

  const [sending, setSending] = useState(false);          // aguardando envio de resposta
  const [penaltyUser, setPenaltyUser] = useState(null);   // usuário a ser penalizado

  // error: mensagem de erro quando o fetch falha. Quando preenchido,
  // a UI exibe um banner com botão "Tentar novamente" (via load()).
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // load: encapsulada em useCallback para que o botão de retry
  // possa reusar a mesma função sem recriá-la a cada render.
  //
  // Estratégia de busca por papel:
  //   Admin → GET /api/denuncias apenas (sugestões não são relevantes)
  //   Dev   → Promise.all([GET /api/sugestoes, GET /api/denuncias])
  //           em paralelo, depois mescla os arrays normalizados.
  //
  // Após o fetch, pré-popula archivedIds com itens que já vieram
  // com status 2 (Arquivado) da API — para que o filtro "Arquivados"
  // mostre o estado real do banco, não apenas o da sessão atual.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchTudo = isAdmin
        ? api.getDenuncias()
            .then(d => (d.denuncias || []).map(denunciaToItem))
        : Promise.all([
            api.getSugestoes().then(s => (s.sugestoes || []).map(sugestaoToItem)),
            api.getDenuncias().then(d => (d.denuncias || []).map(denunciaToItem))
          ]).then(([sugs, dens]) => [...sugs, ...dens]);

      const lista = await fetchTudo;
      setItems(lista);
      // Pré-popula archivedIds com itens já arquivados no banco
      setArchivedIds(new Set(lista.filter(i => i.archived).map(i => i.id)));
    } catch (err) {
      setError(err.message || 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // useEffect: dispara o carregamento na montagem e quando o papel muda
  useEffect(() => { load(); }, [load]);

  // Auto-seleciona o item quando a URL contém ?id=N (ex: vindo do Dashboard)
  useEffect(() => {
    const itemId = searchParams.get('id');
    if (itemId && items.length > 0) {
      const id = parseInt(itemId, 10);
      const found = items.find(i => i.id === id);
      if (found) {
        setSelectedId(id);
        setResponseText(found.response || '');
        // Usa o filtro padrão do papel para manter a aba coerente
        setFilterType(isAdmin ? 'Denúncia' : 'Todos');
      }
    }
  }, [searchParams, items, isAdmin]);

  // isArchiveView: true quando o filtro "Arquivados" está selecionado
  const isArchiveView = filterType === 'Arquivados';

  // activeItems: itens não arquivados usados nos cards de resumo.
  // Admin só conta denúncias; Dev conta todos os tipos.
  const activeItems = items.filter(i =>
    !archivedIds.has(i.id) && (!isAdmin || i.type === 'Denúncia')
  );

  // filteredItems: itens que aparecem na lista conforme o filtro ativo.
  // Admin sempre enxerga só Denúncias, independente do filterType —
  // a linha `if (isAdmin)` é uma camada defensiva adicional.
  const filteredItems = items.filter((item) => {
    const isArchived = archivedIds.has(item.id);
    if (isArchiveView) return isArchived;      // mostra só arquivados
    if (isArchived) return false;              // esconde arquivados dos outros filtros
    if (isAdmin) return item.type === 'Denúncia';
    return filterType === 'Todos' || item.type === filterType;
  });

  const selectedItem = items.find(i => i.id === selectedId) ?? null;
  // statusMap[id] sobrescreve o status original se foi alterado localmente
  const selectedStatus = selectedItem ? (statusMap[selectedItem.id] ?? selectedItem.status) : null;

  // Toggle: clica no mesmo item para fechar, ou em outro para abrir
  function handleSelectItem(id) {
    if (selectedId === id) {
      setSelectedId(null);
      setResponseText('');
    } else {
      setSelectedId(id);
      const item = items.find(i => i.id === id);
      setResponseText(item?.response || '');
    }
  }

  function handleCloseDetail() {
    setSelectedId(null);
    setResponseText('');
  }

  // handleSendResponse: envia a resposta ao usuário e fecha o item.
  //
  // Despacha para o endpoint correto com base em _tipo:
  //   denuncia  → PUT /api/denuncias/:id/responder  { den_resposta }
  //   sugestao  → PUT /api/sugestoes/:id/responder  { sug_resposta }
  //
  // Atualiza o estado localmente mesmo se a chamada à API falhar,
  // para não travar a UX em caso de instabilidade de rede.
  async function handleSendResponse() {
    if (!responseText.trim() || !selectedItem) return;
    setSending(true);
    try {
      if (selectedItem._tipo === 'denuncia') {
        await api.responderDenuncia(selectedItem._id, responseText.trim());
      } else {
        await api.responderSugestao(selectedItem._id, responseText.trim());
      }
    } catch { /* atualiza localmente mesmo sem confirmação da API */ }
    // Atualiza o item na lista sem recarregar tudo
    setItems(prev => prev.map(i =>
      i.id === selectedItem.id
        ? { ...i, response: responseText.trim(), status: 'Resolvido' }
        : i
    ));
    setStatusMap(prev => ({ ...prev, [selectedItem.id]: 'Resolvido' }));
    setSending(false);
  }

  // handleStatusChange: altera o status de um item.
  //
  // Apenas "Em análise" possui endpoint próprio na API:
  //   denuncia → PUT /api/denuncias/:id/analisar
  //   sugestao → PUT /api/sugestoes/:id/analisar
  //
  // As demais transições (Pendente, Resolvido) só atualizam o estado
  // local — "Resolvido" é definido implicitamente via handleSendResponse.
  async function handleStatusChange(id, newStatus) {
    // Atualiza localmente primeiro (UI responsiva)
    setStatusMap(prev => ({ ...prev, [id]: newStatus }));
    const item = items.find(i => i.id === id);
    if (!item) return;
    try {
      if (newStatus === 'Em análise') {
        if (item._tipo === 'denuncia') await api.analisarDenuncia(item._id);
        else await api.analisarSugestao(item._id);
      }
    } catch { /* estado local já atualizado */ }
  }

  // handleArchive: arquiva o item na API e atualiza o estado local.
  //
  // Endpoints:
  //   denuncia → POST /api/denuncias/:id/arquivar
  //   sugestao → POST /api/sugestoes/:id/arquivar
  //
  // Update otimista: mesmo se a API falhar, a UI arquiva localmente.
  // Isso mantém a experiência fluida em caso de lentidão de rede.
  async function handleArchive(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    try {
      if (item._tipo === 'denuncia') await api.arquivarDenuncia(item._id);
      else await api.arquivarSugestao(item._id);
    } catch { /* mantém update otimista */ }
    // new Set(prev) → cria uma cópia do Set antes de modificar
    setArchivedIds(prev => new Set(prev).add(id));
    if (selectedId === id) handleCloseDetail();
  }

  // handleDelete: exclui o item permanentemente via soft delete da API.
  // Exclusivo para Desenvolvedor (per_tipo=2) — o botão só é renderizado
  // quando isDev for true.
  //
  // Endpoints:
  //   denuncia → DELETE /api/denuncias/:id  (204 No Content)
  //   sugestao → DELETE /api/sugestoes/:id  (204 No Content)
  //
  // Após confirmação e chamada à API, remove o item do estado local
  // para que desapareça da lista imediatamente sem recarregar tudo.
  async function handleDelete(id) {
    if (!window.confirm('Excluir permanentemente? Esta ação não pode ser desfeita.')) return;
    const item = items.find(i => i.id === id);
    if (!item) return;
    try {
      if (item._tipo === 'denuncia') await api.deleteDenuncia(item._id);
      else await api.deleteSugestao(item._id);
    } catch { /* remove localmente mesmo se a API falhar */ }
    setItems(prev => prev.filter(i => i.id !== id));
    handleCloseDetail();
  }

  function handleFilterChange(type) {
    setFilterType(type);
    setSelectedId(null);
    setResponseText('');
  }

  // handlePenalizeFromComplaint: abre o PenaltyPanel pré-configurado.
  //
  // Para denúncias de usuário (den_tipo=1): usa usuarioAlvoId/Nome —
  // o usuário que foi denunciado, não quem fez a denúncia.
  // Para denúncias de carona (den_tipo=0): usa userId/userName —
  // o único usuário identificado é o denunciante.
  function handlePenalizeFromComplaint() {
    if (!selectedItem) return;
    setPenaltyUser({
      usu_id:    selectedItem.usuarioAlvoId ?? selectedItem.userId,
      usu_nome:  selectedItem.usuarioAlvoNome ?? selectedItem.userName,
      usu_email: ''
    });
  }

  if (loading) {
    return (
      <div className={styles.container}>
        {/* styles.loadingWrap → centraliza o spinner na tela */}
        <div className={styles.loadingWrap}>
          <Loader2 size={28} className={styles.spin} />
        </div>
      </div>
    );
  }

  // Tela de erro: substitui o antigo .catch(() => setItems([])) silencioso.
  // O usuário vê a mensagem e pode tentar novamente sem recarregar a página.
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{isAdmin ? 'Denúncias' : 'Sugestões e Denúncias'}</h1>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            padding: '48px 24px',
            background: 'var(--surface-primary)',
            border: '1px solid var(--color-neutral-100)',
            borderRadius: 'var(--border-radius-lg)',
            textAlign: 'center'
          }}
        >
          <AlertTriangle size={28} color="var(--color-semantic-error)" />
          <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 600 }}>
            Não foi possível carregar os dados.
          </p>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>{error}</p>
          <button
            type="button"
            onClick={load}
            style={{
              marginTop: 8,
              padding: '8px 16px',
              border: 'none',
              borderRadius: 'var(--border-radius-md)',
              background: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>

      {/* Cabeçalho da página — título muda conforme o papel */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{isAdmin ? 'Denúncias' : 'Sugestões e Denúncias'}</h1>
          <p className={styles.subtitle}>
            {isAdmin
              ? 'Gerencie as denúncias enviadas pelos usuários da sua instituição'
              : 'Gerencie os feedbacks, dúvidas e denúncias enviados pelos usuários'}
          </p>
        </div>
      </div>

      {/* Cards de resumo — Admin não vê o card de Sugestões */}
      <div className={styles.statsRow}>
        {!isAdmin && (
          <div className={styles.statCard}>
            <MessageSquare size={16} className={styles.statIconBlue} />
            <div>
              <p className={styles.statValue}>{activeItems.filter(i => i.type === 'Sugestão').length}</p>
              <p className={styles.statLabel}>Sugestões</p>
            </div>
          </div>
        )}
        <div className={styles.statCard}>
          <AlertTriangle size={16} className={styles.statIconRed} />
          <div>
            <p className={styles.statValue}>{activeItems.filter(i => i.type === 'Denúncia').length}</p>
            <p className={styles.statLabel}>Denúncias</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <Clock size={16} className={styles.statIconYellow} />
          <div>
            {/* statusMap[i.id] ?? i.status → usa o status local se existir */}
            <p className={styles.statValue}>{activeItems.filter(i => (statusMap[i.id] ?? i.status) === 'Pendente').length}</p>
            <p className={styles.statLabel}>Pendentes</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <CheckCircle size={16} className={styles.statIconGreen} />
          <div>
            <p className={styles.statValue}>{activeItems.filter(i => (statusMap[i.id] ?? i.status) === 'Resolvido').length}</p>
            <p className={styles.statLabel}>Resolvidos</p>
          </div>
        </div>
      </div>

      {/* Barra de filtros — Admin vê só 'Denúncia'; Dev vê os três tipos */}
      <div className={styles.filterTabs}>
        {(isAdmin ? ['Denúncia'] : ['Todos', 'Sugestão', 'Denúncia']).map((type) => (
          <button
            key={type}
            className={`${styles.filterBtn} ${filterType === type ? styles.active : ''}`}
            onClick={() => handleFilterChange(type)}
          >
            {type === 'Denúncia' && <AlertTriangle size={13} />}
            {type === 'Sugestão' && <MessageSquare size={13} />}
            {type}
          </button>
        ))}
        {/* Separador visual entre os filtros principais e "Arquivados" */}
        <div className={styles.filterDivider} />
        <button
          className={`${styles.filterBtn} ${isArchiveView ? styles.active : ''}`}
          onClick={() => handleFilterChange('Arquivados')}
        >
          <Archive size={13} />
          Arquivados ({archivedIds.size})
        </button>
      </div>

      {/* Layout mestre-detalhe */}
      <div className={`${styles.layout} ${selectedItem ? styles.layoutWithDetail : ''}`}>

        {/* Painel esquerdo: lista de sugestões/denúncias */}
        <div className={styles.listPanel}>
          {isArchiveView && (
            <div className={styles.archiveBanner}>
              <Archive size={13} />
              Itens arquivados ficam ocultos da lista principal.
            </div>
          )}

          {filteredItems.length === 0 && (
            <div className={styles.emptyState}>
              {isArchiveView
                ? <><Archive size={32} /><p>Nenhum item arquivado.</p></>
                : <><MessageSquare size={32} /><p>Nenhuma entrada encontrada.</p></>}
            </div>
          )}

          {filteredItems.map((item) => {
            const isSelected    = selectedId === item.id;
            const isArchived    = archivedIds.has(item.id);
            const currentStatus = statusMap[item.id] ?? item.status;
            const isDenuncia    = item.type === 'Denúncia';
            const StatusIcon    = STATUS_ICONS[currentStatus] ?? Clock;

            return (
              <div
                key={item.id}
                // Combina múltiplas classes condicionalmente
                className={`
                  ${styles.listCard}
                  ${isDenuncia ? styles.listCardDenuncia : styles.listCardSugestao}
                  ${isSelected ? styles.listCardSelected : ''}
                  ${isArchived ? styles.listCardArchived : ''}
                `}
                onClick={() => handleSelectItem(item.id)}
              >
                <div className={styles.listCardTop}>
                  <span className={`${styles.avatar} ${isDenuncia ? styles.avatarDenuncia : styles.avatarSugestao}`}>
                    {item.avatar}
                  </span>
                  <div className={styles.listCardInfo}>
                    <p className={styles.listCardName}>{item.userName}</p>
                    <span className={styles.listCardDate}>{item.date}</span>
                  </div>
                  <div className={styles.listCardRight}>
                    <span className={`${styles.typeBadge} ${isDenuncia ? styles.typeDenuncia : styles.typeSugestao}`}>
                      {isDenuncia ? <AlertTriangle size={10} /> : <MessageSquare size={10} />}
                      {item.type}
                    </span>
                    <ChevronRight size={14} className={styles.chevron} />
                  </div>
                </div>
                {/* Na lista exibe o motivo (denúncia) ou o texto (sugestão) */}
                <p className={styles.listCardText}>{item.motivo || item.text}</p>
                <div className={styles.listCardFooter}>
                  {/* statusPill, urgentTag e repliedTag só fazem sentido
                      em itens ativos — na aba Arquivados seriam enganosos
                      (ex: "Pendente" para itens com den_status=2 da API). */}
                  {!isArchived && (
                    <>
                      {/* statusPill: pill colorida com ícone e texto do status atual */}
                      <span className={`${styles.statusPill} ${styles[`status_${currentStatus.replace(' ', '_')}`]}`}>
                        <StatusIcon size={11} />
                        {currentStatus}
                      </span>
                      {/* urgentTag: só aparece em denúncias não resolvidas */}
                      {isDenuncia && currentStatus !== 'Resolvido' && (
                        <span className={styles.urgentTag}>
                          <Flag size={10} />
                          Requer atenção
                        </span>
                      )}
                      {/* repliedTag: aparece quando o admin já respondeu */}
                      {item.response && (
                        <span className={styles.repliedTag}>
                          <CornerDownRight size={10} />
                          Respondido
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Painel direito: detalhe do item selecionado.
            (() => { ... })() é uma IIFE — função invocada imediatamente
            para calcular variáveis locais antes de retornar o JSX. */}
        {selectedItem && (() => {
          const isArchived = archivedIds.has(selectedItem.id);
          const isDenuncia = selectedItem.type === 'Denúncia';
          const StatusIcon = STATUS_ICONS[selectedStatus] ?? Clock;

          return (
            <div className={styles.detailPanel}>
              {/* Cabeçalho do detalhe */}
              <div className={styles.detailHeader}>
                <div className={styles.detailHeaderLeft}>
                  <span className={`${styles.typeBadge} ${isDenuncia ? styles.typeDenuncia : styles.typeSugestao}`}>
                    {isDenuncia ? <AlertTriangle size={11} /> : <MessageSquare size={11} />}
                    {selectedItem.type}
                  </span>
                  <span className={styles.detailDate}>{selectedItem.date}</span>
                </div>
                <button className={styles.closeDetailBtn} onClick={handleCloseDetail} title="Fechar">
                  <X size={16} />
                </button>
              </div>

              {/* Remetente */}
              <div className={styles.detailSender}>
                <span className={`${styles.avatarLg} ${isDenuncia ? styles.avatarDenuncia : styles.avatarSugestao}`}>
                  {selectedItem.avatar}
                </span>
                <div>
                  <p className={styles.detailSenderName}>{selectedItem.userName}</p>
                  {/* userId pode ser null em sugestões (API não retorna usu_id na lista) */}
                  {selectedItem.userId && (
                    <p className={styles.detailSenderSub}>
                      <User size={11} /> Usuário #{selectedItem.userId}
                    </p>
                  )}
                </div>
              </div>

              {/* Motivo: campo resumido obrigatório da denúncia (den_motivo).
                  Exibido separadamente do texto detalhado (den_texto). */}
              {isDenuncia && selectedItem.motivo && (
                <div className={styles.detailSection}>
                  <p className={styles.detailSectionLabel}>Motivo</p>
                  <p className={styles.detailText}>{selectedItem.motivo}</p>
                </div>
              )}

              {/* Descrição detalhada da denúncia (den_texto, opcional).
                  Sugestões exibem seu texto aqui como "Mensagem". */}
              {isDenuncia && selectedItem.text && (
                <div className={styles.detailSection}>
                  <p className={styles.detailSectionLabel}>Descrição detalhada</p>
                  <p className={styles.detailText}>{selectedItem.text}</p>
                </div>
              )}
              {!isDenuncia && selectedItem.text && (
                <div className={styles.detailSection}>
                  <p className={styles.detailSectionLabel}>Mensagem</p>
                  <p className={styles.detailText}>{selectedItem.text}</p>
                </div>
              )}

              {/* Contexto de denúncia: só aparece para itens do tipo Denúncia */}
              {isDenuncia && (
                <div className={styles.denunciaContext}>
                  <div className={styles.denunciaContextHeader}>
                    <AlertTriangle size={13} />
                    Contexto da denúncia
                  </div>
                  {/* Exibe o nome do usuário denunciado quando disponível (den_tipo=1) */}
                  {selectedItem.usuarioAlvoNome && (
                    <p className={styles.denunciaContextText}>
                      Usuário denunciado: <strong>{selectedItem.usuarioAlvoNome}</strong>
                    </p>
                  )}
                  <p className={styles.denunciaContextText}>
                    {selectedItem.usuarioAlvoId
                      ? 'Este usuário relatou um problema com outro usuário da plataforma.'
                      : 'Este usuário relatou um problema relacionado a uma carona.'}
                  </p>
                  <div className={styles.denunciaBtnRow}>
                    {!isArchived && (
                      // Abre o PenaltyPanel para aplicar penalidade ao usuário alvo
                      <button className={styles.penalizeBtn} onClick={handlePenalizeFromComplaint}>
                        <ShieldAlert size={14} />
                        Aplicar penalidade ao usuário relatado
                      </button>
                    )}
                    {/* Se a denúncia está vinculada a uma carona, navega até ela */}
                    {selectedItem.caronaId && (
                      <button
                        className={styles.viewRideBtn}
                        onClick={() => navigate(`/caronas?id=${selectedItem.caronaId}`)}
                      >
                        <Car size={14} />
                        Ver carona relacionada
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Seletor de status: botões Pendente / Em análise / Resolvido */}
              <div className={styles.detailSection}>
                <p className={styles.detailSectionLabel}>Status</p>
                <div className={styles.statusRow}>
                  {STATUS_OPTIONS.map(s => {
                    const Icon = STATUS_ICONS[s] ?? Clock;
                    return (
                      <button
                        key={s}
                        className={`${styles.statusOption} ${selectedStatus === s ? styles.statusOptionActive : ''} ${styles[`statusOption_${s.replace(' ', '_')}`]}`}
                        onClick={() => !isArchived && handleStatusChange(selectedItem.id, s)}
                        // Itens arquivados não podem ter status alterado
                        disabled={isArchived}
                      >
                        <Icon size={13} />
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Resposta já enviada (se houver) */}
              {selectedItem.response && (
                <div className={styles.detailSection}>
                  <p className={styles.detailSectionLabel}>Resposta enviada ao usuário</p>
                  <div className={styles.responseBox}>
                    <p className={styles.responseText}>{selectedItem.response}</p>
                  </div>
                </div>
              )}

              {/* Área de resposta: só aparece para itens não arquivados */}
              {!isArchived && (
                <div className={styles.detailSection}>
                  <p className={styles.detailSectionLabel}>
                    {selectedItem.response ? 'Atualizar resposta' : 'Responder ao usuário'}
                  </p>
                  <textarea
                    className={styles.replyInput}
                    rows={4}
                    placeholder={
                      isDenuncia
                        ? 'Informe ao usuário sobre as medidas tomadas em relação à denúncia...'
                        : 'Escreva uma resposta ou explicação sobre a sugestão...'
                    }
                    value={responseText}
                    onChange={e => setResponseText(e.target.value)}
                  />
                  <div className={styles.replyActions}>
                    {/* Botão desabilitado se o campo estiver vazio ou enviando */}
                    <button
                      className={styles.sendBtn}
                      onClick={handleSendResponse}
                      disabled={!responseText.trim() || sending}
                    >
                      {sending
                        ? <><Loader2 size={13} className={styles.spin} /> Enviando...</>
                        : <><Send size={13} /> Enviar resposta</>}
                    </button>
                  </div>
                </div>
              )}

              {/* Rodapé: arquivar (itens ativos) + excluir (Dev only) */}
              <div className={styles.detailActions}>
                {/* Arquivar só aparece para itens ainda não arquivados */}
                {!isArchived && (
                  <button className={styles.archiveBtn} onClick={() => handleArchive(selectedItem.id)}>
                    <Archive size={13} />
                    Arquivar
                  </button>
                )}
                {/* Excluir permanentemente: exclusivo para Desenvolvedor.
                    Usa soft delete na API — o registro fica marcado como
                    deletado e não aparece mais em nenhuma listagem. */}
                {isDev && (
                  <button className={styles.deleteBtn} onClick={() => handleDelete(selectedItem.id)}>
                    <Trash2 size={13} />
                    Excluir
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* PenaltyPanel: abre quando penaltyUser é preenchido em handlePenalizeFromComplaint */}
      {penaltyUser && (
        <PenaltyPanel
          user={penaltyUser}
          onClose={() => setPenaltyUser(null)}
        />
      )}
    </div>
  );
}
