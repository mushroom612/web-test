import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { suggestionsData } from '../data/mockData';
import { StatusBadge } from '../components/StatusBadge';
import { Send, MessageSquare, Archive, ArchiveRestore, ChevronDown, Loader2 } from 'lucide-react';
import styles from './Sugestoes.module.css';

function apiToItem(s) {
  return {
    id: s.sug_id,
    userName: s.usu_nome || `Usuário #${s.usu_id}`,
    avatar: (s.usu_nome || 'U').charAt(0).toUpperCase(),
    date: new Date(s.criado_em).toLocaleDateString('pt-BR'),
    type: s.sug_tipo === 'denuncia' ? 'Denúncia' : 'Sugestão',
    text: s.sug_texto,
    status: s.sug_status === 'aberta' ? 'Pendente'
      : s.sug_status === 'em_analise' ? 'Em análise'
      : 'Resolvido',
    response: s.sug_resposta || null,
    _apiId: s.sug_id
  };
}

export function Sugestoes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('Todos');
  const [selectedId, setSelectedId] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [archivedIds, setArchivedIds] = useState(new Set());
  const [statusMap, setStatusMap] = useState({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api
      .getSugestoes()
      .then((data) => {
        const lista = data.sugestoes || data.data || [];
        setItems(lista.length > 0 ? lista.map(apiToItem) : suggestionsData);
      })
      .catch(() => setItems(suggestionsData))
      .finally(() => setLoading(false));
  }, []);

  const isArchiveView = filterType === 'Arquivados';

  const filteredItems = items.filter((item) => {
    const isArchived = archivedIds.has(item.id);
    if (isArchiveView) return isArchived;
    if (isArchived) return false;
    return filterType === 'Todos' || item.type === filterType;
  });

  function handleSelectItem(id) {
    if (selectedId === id) {
      setSelectedId(null);
      setResponseText('');
    } else {
      setSelectedId(id);
      const item = items.find((i) => i.id === id);
      setResponseText(item?.response || '');
    }
  }

  async function handleSendResponse(item) {
    if (!responseText.trim()) return;
    setSending(true);
    try {
      await api.responderSugestao(item._apiId || item.id, responseText.trim());
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, response: responseText.trim(), status: 'Resolvido' }
            : i
        )
      );
      setStatusMap((prev) => ({ ...prev, [item.id]: 'Resolvido' }));
    } catch {
      // sem acesso à API — salva localmente
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, response: responseText.trim() } : i
        )
      );
    } finally {
      setSending(false);
      setSelectedId(null);
      setResponseText('');
    }
  }

  async function handleStatusChange(id, newStatus) {
    setStatusMap((prev) => ({ ...prev, [id]: newStatus }));
    if (newStatus === 'Em análise') {
      try {
        await api.analisarSugestao(id);
      } catch {
        // sem acesso — estado local já atualizado
      }
    }
  }

  function handleArchive(id) {
    setArchivedIds((prev) => new Set(prev).add(id));
    if (selectedId === id) {
      setSelectedId(null);
      setResponseText('');
    }
  }

  function handleUnarchive(id) {
    setArchivedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function handleFilterChange(type) {
    setFilterType(type);
    setSelectedId(null);
    setResponseText('');
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Sugestões e Denúncias</h1>
      </div>

      <div className={styles.filterTabs}>
        {['Todos', 'Sugestão', 'Denúncia'].map((type) => (
          <button
            key={type}
            className={`${styles.filterBtn} ${filterType === type ? styles.active : ''}`}
            onClick={() => handleFilterChange(type)}
          >
            {type}
          </button>
        ))}
        <div className={styles.filterDivider} />
        <button
          className={`${styles.filterBtn} ${styles.filterBtnArchive} ${isArchiveView ? styles.active : ''}`}
          onClick={() => handleFilterChange('Arquivados')}
        >
          <Archive size={13} />
          Arquivados
        </button>
      </div>

      {isArchiveView && (
        <div className={styles.archiveBanner}>
          <Archive size={14} />
          <span>Itens arquivados ficam ocultos da lista principal. Você pode restaurá-los a qualquer momento.</span>
        </div>
      )}

      <div className={styles.list}>
        {filteredItems.map((item) => {
          const isSelected = selectedId === item.id;
          const savedResponse = item.response;
          const isArchived = archivedIds.has(item.id);
          const currentStatus = statusMap[item.id] ?? item.status;

          return (
            <div
              key={item.id}
              className={`${styles.suggestionCard} ${isSelected ? styles.cardSelected : ''} ${isArchived ? styles.cardArchived : ''}`}
            >
              <div className={styles.cardHeader}>
                <div className={styles.userInfo}>
                  <span className={styles.avatar}>{item.avatar}</span>
                  <div className={styles.details}>
                    <p className={styles.name}>{item.userName}</p>
                    <span className={styles.date}>{item.date}</span>
                  </div>
                </div>
                <div className={styles.typeAndStatus}>
                  <StatusBadge status={item.type} />
                  <div className={styles.statusSelector}>
                    <select
                      className={styles.statusSelect}
                      value={currentStatus}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Em análise">Em análise</option>
                      <option value="Resolvido">Resolvido</option>
                    </select>
                    <ChevronDown className={styles.selectIcon} size={14} />
                  </div>
                </div>
              </div>

              <p className={styles.text}>{item.text}</p>

              {savedResponse && (
                <div className={styles.responseSection}>
                  <p className={styles.responseLabel}>Resposta do Admin:</p>
                  <p className={styles.responseText}>{savedResponse}</p>
                </div>
              )}

              {isSelected && !isArchived && (
                <div className={styles.replyArea}>
                  <label className={styles.replyLabel}>
                    <MessageSquare size={14} />
                    Resposta do Administrador
                  </label>
                  <textarea
                    className={styles.replyInput}
                    rows={3}
                    placeholder="Escreva sua resposta aqui..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                  />
                  <div className={styles.replyActions}>
                    <button
                      className={styles.sendBtn}
                      onClick={() => handleSendResponse(item)}
                      disabled={!responseText.trim() || sending}
                    >
                      <Send size={14} />
                      {sending ? 'Enviando...' : 'Enviar Solução'}
                    </button>
                    <button
                      className={styles.secondaryBtn}
                      onClick={() => { setSelectedId(null); setResponseText(''); }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {!isSelected && (
                <div className={styles.cardFooter}>
                  <div className={styles.actions}>
                    {!isArchived && (
                      <button
                        className={styles.secondaryBtn}
                        onClick={() => handleSelectItem(item.id)}
                      >
                        {savedResponse ? 'Editar Resposta' : 'Responder'}
                      </button>
                    )}
                    {isArchived ? (
                      <button className={styles.unarchiveBtn} onClick={() => handleUnarchive(item.id)}>
                        <ArchiveRestore size={14} />
                        Restaurar
                      </button>
                    ) : (
                      <button className={styles.archiveBtn} onClick={() => handleArchive(item.id)}>
                        <Archive size={14} />
                        Arquivar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className={styles.noResults}>
          {isArchiveView
            ? <p>Nenhum item arquivado.</p>
            : <p>Nenhuma sugestão ou denúncia encontrada.</p>
          }
        </div>
      )}
    </div>
  );
}
