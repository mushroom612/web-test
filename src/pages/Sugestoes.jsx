import { useState } from 'react';
import { suggestionsData } from '../data/mockData';
import { StatusBadge } from '../components/StatusBadge';
import { Send, MessageSquare, Archive, ArchiveRestore } from 'lucide-react';
import styles from './Sugestoes.module.css';

export function Sugestoes() {
  const [filterType, setFilterType] = useState('Todos');
  const [selectedId, setSelectedId] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [responses, setResponses] = useState({});
  const [sentIds, setSentIds] = useState(new Set());
  const [archivedIds, setArchivedIds] = useState(new Set());

  const isArchiveView = filterType === 'Arquivados';

  const filteredSuggestions = suggestionsData.filter((item) => {
    const isArchived = archivedIds.has(item.id);
    if (isArchiveView) return isArchived;
    if (isArchived) return false;
    return filterType === 'Todos' || item.type === filterType;
  });

  const archivedCount = archivedIds.size;

  function handleSelectItem(id) {
    if (selectedId === id) {
      setSelectedId(null);
      setResponseText('');
    } else {
      setSelectedId(id);
      setResponseText(responses[id] ?? '');
    }
  }

  function handleSendResponse(item) {
    if (!responseText.trim()) return;
    setResponses(prev => ({ ...prev, [item.id]: responseText.trim() }));
    setSentIds(prev => new Set(prev).add(item.id));
    setSelectedId(null);
    setResponseText('');
  }

  function handleArchive(id) {
    setArchivedIds(prev => new Set(prev).add(id));
    if (selectedId === id) {
      setSelectedId(null);
      setResponseText('');
    }
  }

  function handleUnarchive(id) {
    setArchivedIds(prev => {
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
          {archivedCount > 0 && (
            <span className={`${styles.archiveBadge} ${isArchiveView ? styles.archiveBadgeActive : ''}`}>
              {archivedCount}
            </span>
          )}
        </button>
      </div>

      {isArchiveView && (
        <div className={styles.archiveBanner}>
          <Archive size={14} />
          <span>Itens arquivados ficam ocultos da lista principal. Você pode restaurá-los a qualquer momento.</span>
        </div>
      )}

      <div className={styles.list}>
        {filteredSuggestions.map((item) => {
          const isSelected = selectedId === item.id;
          const savedResponse = responses[item.id] ?? item.response;
          const wasSent = sentIds.has(item.id);
          const isArchived = archivedIds.has(item.id);

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
                  <StatusBadge status={item.status} />
                </div>
              </div>

              <p className={styles.text}>{item.text}</p>

              {savedResponse && (
                <div className={styles.responseSection}>
                  <p className={styles.responseLabel}>
                    {wasSent ? 'Resposta enviada:' : 'Resposta do Admin:'}
                  </p>
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
                    onChange={e => setResponseText(e.target.value)}
                  />
                  <div className={styles.replyActions}>
                    <button
                      className={styles.sendBtn}
                      onClick={() => handleSendResponse(item)}
                      disabled={!responseText.trim()}
                    >
                      <Send size={14} />
                      Enviar Solução
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
                      <button
                        className={styles.unarchiveBtn}
                        onClick={() => handleUnarchive(item.id)}
                      >
                        <ArchiveRestore size={14} />
                        Restaurar
                      </button>
                    ) : (
                      <button
                        className={styles.archiveBtn}
                        onClick={() => handleArchive(item.id)}
                      >
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

      {filteredSuggestions.length === 0 && (
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
