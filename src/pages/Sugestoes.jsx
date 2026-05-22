// ============================================================
// pages/Sugestoes.jsx — Página de sugestões e denúncias
//
// Gerencia os feedbacks enviados pelos usuários: sugestões de
// melhoria e denúncias de problemas/comportamentos inadequados.
// Usa layout mestre-detalhe igual à página de Caronas.
//
// Endpoints da API (consumidos via services/api.js):
//   - GET  /api/sugestoes                    → lista (escopo automático)
//   - PUT  /api/sugestoes/{id}/analisar      → status → 3 (Em análise)
//   - PUT  /api/sugestoes/{id}/responder     → grava resposta + fecha (0)
//   - POST /api/sugestoes/{id}/arquivar      → status → 2 (Arquivada)
//
// Limitações vindas da API (deliberadas no backend):
//   - A resposta NÃO devolve usu_id do autor (privacidade). Por isso o
//     botão "Aplicar penalidade ao usuário relatado" foi removido — o
//     admin precisa buscar pelo nome em /usuarios.
//   - Não existe vínculo "sug_carona_id" no schema; o botão "Ver carona
//     relacionada" foi removido.
//   - Arquivar é one-way: não há endpoint de desarquivar. O botão
//     "Restaurar da lista" foi removido.
//
// Funcionalidades:
//   - Filtros por tipo (Todos / Sugestão / Denúncia / Arquivados)
//   - Cards de resumo (sugestões, denúncias, pendentes, resolvidos)
//   - Painel de detalhe com status, resposta e arquivar
//   - Responder ao usuário via textarea (fecha como Resolvido)
//   - Marcar como Em análise (única transição direta de status)
//   - Auto-seleção via URL (?id=N) quando navegado do Dashboard
//
// Estilo: Sugestoes.module.css
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import {
  Send, MessageSquare, Archive,
  Loader2, AlertTriangle, CheckCircle, Clock,
  Flag, User, ChevronRight, X,
  CornerDownRight, Info
} from 'lucide-react';
import styles from './Sugestoes.module.css';

// apiToItem: converte o registro da API (/api/sugestoes) para o
// formato interno usado pelos componentes visuais.
//
// Mapeamento (API real → UI):
//   autor       → userName       (mock antigo usava usu_nome)
//   sug_data    → date (BR)      (mock antigo usava criado_em)
//   sug_tipo    → type           (0 = Denúncia, 1 = Sugestão)
//   sug_status  → status         (0 = Resolvido, 1 = Pendente,
//                                 2 = Arquivado, 3 = Em análise)
//   sug_resposta → response
//
// Campos REMOVIDOS por não estarem na resposta do backend:
//   userId      (a API esconde usu_id do autor)
//   caronaId    (não existe na tabela SUGESTAO_DENUNCIA)
function apiToItem(s) {
  const nome = s.autor || s.usu_nome || 'Usuário desconhecido';
  const tipo = s.sug_tipo === 0 ? 'Denúncia' : 'Sugestão';
  const status =
    s.sug_status === 0 ? 'Resolvido'
    : s.sug_status === 3 ? 'Em análise'
    : s.sug_status === 2 ? 'Arquivado'
    : 'Pendente';
  return {
    id: s.sug_id,
    userName: nome,
    avatar: nome.charAt(0).toUpperCase(),
    date: s.sug_data
      ? new Date(s.sug_data).toLocaleDateString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      : '—',
    type: tipo,
    text: s.sug_texto,
    status,
    response: s.sug_resposta || null
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
  // error: preenchido quando GET /api/sugestoes falha. Mostra banner
  // com botão de retry e suprime a UI principal até o usuário tentar
  // de novo. Substitui o antigo fallback silencioso para mock.
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('Todos');  // filtro ativo
  const [selectedId, setSelectedId] = useState(null);     // item selecionado no detalhe
  const [responseText, setResponseText] = useState('');   // texto da resposta digitada
  const [sending, setSending] = useState(false);          // aguardando envio de resposta
  // actionError: erro pontual de uma ação (analisar/arquivar/responder).
  // Aparece no painel de detalhe sem destruir o estado da lista.
  const [actionError, setActionError] = useState(null);
  // pendingAction: nome da ação em andamento (ex: 'analisar', 'arquivar')
  // para desabilitar os botões adequados durante a chamada à API.
  const [pendingAction, setPendingAction] = useState(null);

  const [searchParams] = useSearchParams();

  // load: chamada na montagem e pelo botão "Tentar novamente".
  // Mantida em useCallback para identidade estável e reuso.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSugestoes();
      const lista = data?.sugestoes || [];
      setItems(lista.map(apiToItem));
    } catch (err) {
      setError(err.message || 'Não foi possível carregar sugestões e denúncias.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
        setFilterType('Todos');
      }
    }
  }, [searchParams, items]);

  // isArchiveView: true quando o filtro "Arquivados" está selecionado
  const isArchiveView = filterType === 'Arquivados';

  // activeItems: itens que NÃO estão arquivados (status !== 'Arquivado').
  // Antes era controlado por um Set local; agora vem direto do status
  // do registro, que reflete sug_status=2 no banco.
  const activeItems = items.filter(i => i.status !== 'Arquivado');

  // filteredItems: itens que aparecem na lista conforme o filtro ativo
  const filteredItems = items.filter((item) => {
    const isArchived = item.status === 'Arquivado';
    if (isArchiveView) return isArchived;      // mostra só arquivados
    if (isArchived) return false;              // esconde arquivados dos outros filtros
    return filterType === 'Todos' || item.type === filterType;
  });

  // Contador para a aba "Arquivados (N)" — substitui o antigo archivedIds.size.
  const archivedCount = items.filter(i => i.status === 'Arquivado').length;

  const selectedItem = items.find(i => i.id === selectedId) ?? null;
  // selectedStatus vem direto do item (sem statusMap intermediário) —
  // sempre reflete a última resposta da API após atualização otimista.
  const selectedStatus = selectedItem ? selectedItem.status : null;

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
    setActionError(null);
  }

  function handleCloseDetail() {
    setSelectedId(null);
    setResponseText('');
    setActionError(null);
  }

  // updateItem: helper que mescla campos novos no item da lista pelo id.
  function updateItem(id, patch) {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, ...patch } : i)));
  }

  // Envia a resposta ao usuário.
  // Endpoint: PUT /api/sugestoes/{id}/responder { sug_resposta }.
  // Sucesso → status muda para "Resolvido" e a resposta vira oficial.
  async function handleSendResponse() {
    if (!responseText.trim() || !selectedItem) return;
    setSending(true);
    setActionError(null);
    try {
      const texto = responseText.trim();
      await api.responderSugestao(selectedItem.id, texto);
      updateItem(selectedItem.id, { response: texto, status: 'Resolvido' });
    } catch (err) {
      setActionError(err.message || 'Não foi possível enviar a resposta.');
    } finally {
      setSending(false);
    }
  }

  // Marca como "Em análise" — única transição direta de status suportada
  // pela API. Pendente → Em análise. Outras transições só acontecem via
  // handleSendResponse (Resolvido) ou handleArchive (Arquivado).
  async function handleMarkInAnalysis(id) {
    setPendingAction('analisar');
    setActionError(null);
    try {
      await api.analisarSugestao(id);
      updateItem(id, { status: 'Em análise' });
    } catch (err) {
      setActionError(err.message || 'Não foi possível marcar como Em análise.');
    } finally {
      setPendingAction(null);
    }
  }

  // Arquiva a sugestão/denúncia.
  // Endpoint: POST /api/sugestoes/{id}/arquivar. Operação one-way:
  // não existe endpoint de desarquivar, então removemos esse botão.
  async function handleArchive(id) {
    setPendingAction('arquivar');
    setActionError(null);
    try {
      await api.arquivarSugestao(id);
      updateItem(id, { status: 'Arquivado' });
      if (selectedId === id) handleCloseDetail();
    } catch (err) {
      setActionError(err.message || 'Não foi possível arquivar.');
    } finally {
      setPendingAction(null);
    }
  }

  function handleFilterChange(type) {
    setFilterType(type);
    setSelectedId(null);
    setResponseText('');
    setActionError(null);
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

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Sugestões e Denúncias</h1>
            <p className={styles.subtitle}>Gerencie os feedbacks, dúvidas e denúncias enviados pelos usuários</p>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
            padding: '48px 24px',
            background: 'var(--surface-primary)',
            border: '1px solid var(--color-neutral-100)',
            borderRadius: 'var(--border-radius-lg)',
            color: 'var(--text-secondary)',
            textAlign: 'center'
          }}
        >
          <AlertTriangle size={28} color="var(--color-semantic-error)" />
          <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 600 }}>
            Não foi possível carregar a lista.
          </p>
          <p style={{ margin: 0, fontSize: 13 }}>{error}</p>
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
            {/* Status refletido diretamente do item (sem overlay local) */}
            <p className={styles.statValue}>{activeItems.filter(i => i.status === 'Pendente').length}</p>
            <p className={styles.statLabel}>Pendentes</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <CheckCircle size={16} className={styles.statIconGreen} />
          <div>
            <p className={styles.statValue}>{activeItems.filter(i => i.status === 'Resolvido').length}</p>
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
          Arquivados ({archivedCount})
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
            const isArchived = item.status === 'Arquivado';
            const currentStatus = item.status;
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
