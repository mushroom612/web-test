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
//   - Arquivar/restaurar itens sem excluí-los
//   - Aplicar penalidade ao usuário denunciado (abre PenaltyPanel)
//   - Navegar para a carona vinculada (abre /caronas?id=N)
//   - Auto-seleção via URL (?id=N) quando navegado do Dashboard
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

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { apiSuggestionsData } from '../data/mockData';
import {
  Send, MessageSquare, Archive, ArchiveRestore,
  Loader2, AlertTriangle, CheckCircle, Clock,
  Flag, ShieldAlert, User, ChevronRight, X,
  CornerDownRight, Info, Car
} from 'lucide-react';
import { PenaltyPanel } from '../components/PenaltyPanel';
import styles from './Sugestoes.module.css';

// apiToItem: converte o formato da API (sug_*) para o formato interno.
// sug_tipo: 0 = Sugestão, 1 = Denúncia
// sug_status: 0 = Pendente, 1 = Resolvido, 2 = Em análise
function apiToItem(s) {
  return {
    id: s.sug_id,
    userId: s.usu_id,
    userName: s.usu_nome || `Usuário #${s.usu_id}`,
    avatar: (s.usu_nome || 'U').charAt(0).toUpperCase(),
    date: new Date(s.criado_em).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }),
    type: s.sug_tipo === 1 ? 'Denúncia' : 'Sugestão',
    text: s.sug_texto,
    status: s.sug_status === 1 ? 'Resolvido'
      : s.sug_status === 2 ? 'Em análise'
      : 'Pendente',
    response: s.sug_resposta || null,
    caronaId: s.sug_carona_id || null,
    _apiId: s.sug_id
  };
}

// STATUS_OPTIONS: opções de status que o admin pode definir para um item
const STATUS_OPTIONS = ['Pendente', 'Em análise', 'Resolvido'];

// STATUS_ICONS: mapeia cada status para seu ícone correspondente
const STATUS_ICONS = {
  'Pendente': Clock,
  'Em análise': Info,
  'Resolvido': CheckCircle
};

export function Sugestoes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('Todos');  // filtro ativo
  const [selectedId, setSelectedId] = useState(null);     // item selecionado no detalhe
  const [responseText, setResponseText] = useState('');   // texto da resposta digitada
  // archivedIds: Set (conjunto) de IDs arquivados.
  // Set é como um array, mas não permite duplicatas — ideal para IDs.
  const [archivedIds, setArchivedIds] = useState(new Set());
  // statusMap: sobrescreve o status de itens localmente sem precisar
  // recarregar toda a lista da API após uma mudança de status.
  const [statusMap, setStatusMap] = useState({});
  const [sending, setSending] = useState(false);          // aguardando envio de resposta
  const [penaltyUser, setPenaltyUser] = useState(null);   // usuário a ser penalizado

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Carrega as sugestões da API ao montar o componente
  useEffect(() => {
    api
      .getSugestoes()
      .then((data) => {
        const lista = data.sugestoes || data.data || [];
        setItems(lista.length > 0 ? lista.map(apiToItem) : apiSuggestionsData.map(apiToItem));
      })
      .catch(() => setItems(apiSuggestionsData.map(apiToItem)))
      .finally(() => setLoading(false));
  }, []);

  // Auto-seleciona o item quando a URL contém ?id=N (ex: vindo do Dashboard)
  useEffect(() => {
    const itemId = searchParams.get('id');
    if (itemId && items.length > 0) {
      const id = parseInt(itemId, 10);
      const found = items.find(i => i.id === id);
      if (found) {
        setSelectedId(id);
        setResponseText(found.response || '');
        setFilterType('Todos');
      }
    }
  }, [searchParams, items]);

  // isArchiveView: true quando o filtro "Arquivados" está selecionado
  const isArchiveView = filterType === 'Arquivados';

  // activeItems: itens que NÃO estão arquivados (para calcular resumos)
  const activeItems = items.filter(i => !archivedIds.has(i.id));

  // filteredItems: itens que aparecem na lista conforme o filtro ativo
  const filteredItems = items.filter((item) => {
    const isArchived = archivedIds.has(item.id);
    if (isArchiveView) return isArchived;      // mostra só arquivados
    if (isArchived) return false;              // esconde arquivados dos outros filtros
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

  // Envia a resposta do admin para o usuário que fez a sugestão/denúncia.
  // Atualiza o estado localmente para refletir a mudança imediatamente.
  async function handleSendResponse() {
    if (!responseText.trim() || !selectedItem) return;
    setSending(true);
    try {
      await api.responderSugestao(selectedItem._apiId || selectedItem.id, responseText.trim());
    } catch { /* atualiza localmente mesmo sem API */ }
    // Atualiza o item na lista sem recarregar tudo
    setItems(prev => prev.map(i =>
      i.id === selectedItem.id
        ? { ...i, response: responseText.trim(), status: 'Resolvido' }
        : i
    ));
    setStatusMap(prev => ({ ...prev, [selectedItem.id]: 'Resolvido' }));
    setSending(false);
  }

  // Altera o status de um item e sincroniza com a API quando necessário
  async function handleStatusChange(id, newStatus) {
    // Atualiza localmente primeiro (UI responsiva)
    setStatusMap(prev => ({ ...prev, [id]: newStatus }));
    try {
      if (newStatus === 'Em análise') await api.analisarSugestao(id);
    } catch { /* estado local já atualizado */ }
  }

  // Arquivar: adiciona o ID ao Set de arquivados e fecha o detalhe
  function handleArchive(id) {
    // new Set(prev) → cria uma cópia do Set antes de modificar
    setArchivedIds(prev => new Set(prev).add(id));
    if (selectedId === id) handleCloseDetail();
  }

  // Restaurar: remove o ID do Set de arquivados
  function handleUnarchive(id) {
    setArchivedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  }

  function handleFilterChange(type) {
    setFilterType(type);
    setSelectedId(null);
    setResponseText('');
  }

  // Abre o PenaltyPanel pré-configurado com o usuário denunciado
  function handlePenalizeFromComplaint() {
    if (!selectedItem) return;
    setPenaltyUser({
      usu_id: selectedItem.userId,
      usu_nome: selectedItem.userName,
      usu_email: `${selectedItem.userName.toLowerCase().replace(' ', '.')}@usuario.br`
    });
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrap}>
          <Loader2 size={28} className={styles.spin} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Sugestões e Denúncias</h1>
          <p className={styles.subtitle}>Gerencie os feedbacks, dúvidas e denúncias enviados pelos usuários</p>
        </div>
      </div>

      {/* Cards de resumo: contadores por categoria (só itens não arquivados) */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <MessageSquare size={16} className={styles.statIconBlue} />
          <div>
            <p className={styles.statValue}>{activeItems.filter(i => i.type === 'Sugestão').length}</p>
            <p className={styles.statLabel}>Sugestões</p>
          </div>
        </div>
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

      {/* Barra de filtros por tipo + botão de arquivados */}
      <div className={styles.filterTabs}>
        {['Todos', 'Sugestão', 'Denúncia'].map((type) => (
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
            const isSelected = selectedId === item.id;
            const isArchived = archivedIds.has(item.id);
            const currentStatus = statusMap[item.id] ?? item.status;
            const isDenuncia = item.type === 'Denúncia';
            const StatusIcon = STATUS_ICONS[currentStatus] ?? Clock;

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
                <p className={styles.listCardText}>{item.text}</p>
                <div className={styles.listCardFooter}>
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
                  <p className={styles.detailSenderSub}>
                    <User size={11} /> Usuário #{selectedItem.userId}
                  </p>
                </div>
              </div>

              {/* Texto da mensagem enviada pelo usuário */}
              <div className={styles.detailSection}>
                <p className={styles.detailSectionLabel}>Mensagem</p>
                <p className={styles.detailText}>{selectedItem.text}</p>
              </div>

              {/* Contexto de denúncia: só aparece para itens do tipo Denúncia */}
              {isDenuncia && (
                <div className={styles.denunciaContext}>
                  <div className={styles.denunciaContextHeader}>
                    <AlertTriangle size={13} />
                    Contexto da denúncia
                  </div>
                  <p className={styles.denunciaContextText}>
                    Este usuário relatou um problema relacionado a uma carona ou a outro usuário da plataforma.
                    Analise o relato, tome as medidas necessárias e informe o usuário sobre a resolução.
                  </p>
                  <div className={styles.denunciaBtnRow}>
                    {!isArchived && (
                      // Abre o PenaltyPanel para aplicar penalidade ao usuário denunciado
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

              {/* Rodapé: arquivar ou restaurar */}
              <div className={styles.detailActions}>
                {isArchived ? (
                  <button className={styles.unarchiveBtn} onClick={() => handleUnarchive(selectedItem.id)}>
                    <ArchiveRestore size={13} />
                    Restaurar da lista
                  </button>
                ) : (
                  <button className={styles.archiveBtn} onClick={() => handleArchive(selectedItem.id)}>
                    <Archive size={13} />
                    Arquivar
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
