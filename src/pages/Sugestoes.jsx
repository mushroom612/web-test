import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { apiSuggestionsData } from '../data/mockData';
import {
  Send, MessageSquare, Archive, ArchiveRestore,
  Loader2, AlertTriangle, CheckCircle, Clock,
  Flag, ShieldAlert, User, ChevronRight, X,
  CornerDownRight, Info
} from 'lucide-react';
import { PenaltyPanel } from '../components/PenaltyPanel';
import styles from './Sugestoes.module.css';

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
    _apiId: s.sug_id
  };
}

const STATUS_OPTIONS = ['Pendente', 'Em análise', 'Resolvido'];

const STATUS_ICONS = {
  'Pendente': Clock,
  'Em análise': Info,
  'Resolvido': CheckCircle
};

export function Sugestoes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('Todos');
  const [selectedId, setSelectedId] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [archivedIds, setArchivedIds] = useState(new Set());
  const [statusMap, setStatusMap] = useState({});
  const [sending, setSending] = useState(false);
  const [penaltyUser, setPenaltyUser] = useState(null);

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

  const isArchiveView = filterType === 'Arquivados';
  const activeItems = items.filter(i => !archivedIds.has(i.id));

  const filteredItems = items.filter((item) => {
    const isArchived = archivedIds.has(item.id);
    if (isArchiveView) return isArchived;
    if (isArchived) return false;
    return filterType === 'Todos' || item.type === filterType;
  });

  const selectedItem = items.find(i => i.id === selectedId) ?? null;
  const selectedStatus = selectedItem ? (statusMap[selectedItem.id] ?? selectedItem.status) : null;

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

  async function handleSendResponse() {
    if (!responseText.trim() || !selectedItem) return;
    setSending(true);
    try {
      await api.responderSugestao(selectedItem._apiId || selectedItem.id, responseText.trim());
    } catch { /* atualiza localmente mesmo sem API */ }
    setItems(prev => prev.map(i =>
      i.id === selectedItem.id
        ? { ...i, response: responseText.trim(), status: 'Resolvido' }
        : i
    ));
    setStatusMap(prev => ({ ...prev, [selectedItem.id]: 'Resolvido' }));
    setSending(false);
  }

  async function handleStatusChange(id, newStatus) {
    setStatusMap(prev => ({ ...prev, [id]: newStatus }));
    try {
      if (newStatus === 'Em análise') await api.analisarSugestao(id);
    } catch { /* estado local já atualizado */ }
  }

  function handleArchive(id) {
    setArchivedIds(prev => new Set(prev).add(id));
    if (selectedId === id) handleCloseDetail();
  }

  function handleUnarchive(id) {
    setArchivedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  }

  function handleFilterChange(type) {
    setFilterType(type);
    setSelectedId(null);
    setResponseText('');
  }

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

      {/* Cabeçalho */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Sugestões e Denúncias</h1>
          <p className={styles.subtitle}>Gerencie os feedbacks, dúvidas e denúncias enviados pelos usuários</p>
        </div>
      </div>

      {/* Resumo */}
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

      {/* Filtros */}
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

        {/* Lista */}
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
                  <span className={`${styles.statusPill} ${styles[`status_${currentStatus.replace(' ', '_')}`]}`}>
                    <StatusIcon size={11} />
                    {currentStatus}
                  </span>
                  {isDenuncia && currentStatus !== 'Resolvido' && (
                    <span className={styles.urgentTag}>
                      <Flag size={10} />
                      Requer atenção
                    </span>
                  )}
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

        {/* Painel de detalhe */}
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

              {/* Mensagem original */}
              <div className={styles.detailSection}>
                <p className={styles.detailSectionLabel}>Mensagem</p>
                <p className={styles.detailText}>{selectedItem.text}</p>
              </div>

              {/* Contexto de denúncia */}
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
                  {!isArchived && (
                    <button className={styles.penalizeBtn} onClick={handlePenalizeFromComplaint}>
                      <ShieldAlert size={14} />
                      Aplicar penalidade ao usuário relatado
                    </button>
                  )}
                </div>
              )}

              {/* Status */}
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
                        disabled={isArchived}
                      >
                        <Icon size={13} />
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Resposta existente */}
              {selectedItem.response && (
                <div className={styles.detailSection}>
                  <p className={styles.detailSectionLabel}>Resposta enviada ao usuário</p>
                  <div className={styles.responseBox}>
                    <p className={styles.responseText}>{selectedItem.response}</p>
                  </div>
                </div>
              )}

              {/* Área de resposta */}
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

              {/* Ações do rodapé */}
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

      {/* Painel de penalidade */}
      {penaltyUser && (
        <PenaltyPanel
          user={penaltyUser}
          onClose={() => setPenaltyUser(null)}
        />
      )}
    </div>
  );
}
