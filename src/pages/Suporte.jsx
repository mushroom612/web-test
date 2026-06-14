// ============================================================
// pages/Suporte.jsx — Chat de suporte Admin ↔ Desenvolvedor  [v30]
//
// Papéis:
//   Dev (per_tipo=2): vê lista de conversas à esquerda + thread à direita.
//                     Ao selecionar um admin, entra na sala de socket e carrega
//                     a thread via HTTP.
//   Admin (per_tipo=1): não vê a lista — carrega automaticamente a própria
//                       thread e entra na sala ao montar.
//
// Transporte de mensagens:
//   Envio   → HTTP POST (confiável, persistido antes do broadcast)
//   Recepção→ Socket.io evento 'mensagem_suporte_recebida' (tempo real)
//             + carregamento inicial via HTTP
//
// Estilo: Suporte.module.css
// ============================================================

import { Fragment, useEffect, useRef, useState, useCallback } from 'react';
import { IconSend, IconMessage } from '@tabler/icons-react';
import { api } from '../services/api';
import { useSuporteSocket } from '../hooks/useSuporteSocket';
import styles from './Suporte.module.css';

function getInitials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase() || '?'
  );
}

function formatHora(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const hhmm = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const hoje = new Date();
  const mesmoDia =
    d.getDate() === hoje.getDate() &&
    d.getMonth() === hoje.getMonth() &&
    d.getFullYear() === hoje.getFullYear();
  if (mesmoDia) return hhmm;
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${hhmm}`;
}

// mesmoDiaCal: true se duas datas ISO caem no mesmo dia do calendário.
function mesmoDiaCal(a, b) {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

// formatDataSeparador: rótulo do separador de data (Hoje / Ontem / data),
// igual ao chat do app.
function formatDataSeparador(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);
  if (mesmoDiaCal(d, hoje)) return 'Hoje';
  if (mesmoDiaCal(d, ontem)) return 'Ontem';
  const mesmoAno = d.getFullYear() === hoje.getFullYear();
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: mesmoAno ? 'long' : '2-digit',
    ...(mesmoAno ? {} : { year: 'numeric' })
  });
}

export function Suporte() {
  const { socket, connected }    = useSuporteSocket();

  const [conversas,     setConversas]     = useState([]);
  const [selectedId,    setSelectedId]    = useState(null);
  const [mensagens,     setMensagens]     = useState([]);
  const [input,         setInput]         = useState('');
  const [loadingLista,  setLoadingLista]  = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending,       setSending]       = useState(false);

  const bodyRef          = useRef(null);
  const prevSelectedRef  = useRef(null);

  const selected = conversas.find((c) => c.usu_id === selectedId) || null;

  // ── Carrega lista de conversas ────────────────────────────────────────
  const loadLista = useCallback(async (silent = false) => {
    if (!silent) setLoadingLista(true);
    try {
      const data = await api.getConversasSuporte();
      setConversas(data || []);
    } catch {
      // silencioso
    } finally {
      if (!silent) setLoadingLista(false);
    }
  }, []);

  useEffect(() => {
    loadLista();
  }, [loadLista]);

  // ── Carrega thread ─────────────────────────────────────────────────────
  const loadThread = useCallback(async (adminId, silent = false) => {
    if (!adminId) return;
    if (!silent) setLoadingThread(true);
    try {
      const data = await api.getThreadSuporte(adminId);
      setMensagens(data?.mensagens || []);
      api.marcarLidasSuporte({ usuId: adminId }).catch(() => {});
      loadLista(true);
    } catch {
      // silencioso
    } finally {
      if (!silent) setLoadingThread(false);
    }
  }, [loadLista]);

  // ── Troca de sala ao selecionar outra conversa ────────────────────────
  useEffect(() => {
    if (!socket) return;
    const prev = prevSelectedRef.current;
    if (prev && prev !== selectedId) socket.emit('sair_suporte', { admin_usu_id: prev });
    if (selectedId && connected) socket.emit('entrar_suporte', { admin_usu_id: selectedId });
    prevSelectedRef.current = selectedId;
  }, [selectedId, socket, connected]);

  // ── Carrega thread ao selecionar ──────────────────────────────────────
  useEffect(() => {
    if (selectedId == null) return;
    loadThread(selectedId);
  }, [selectedId, loadThread]);

  // ── Recebe mensagens em tempo real ─────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleMsg = (msg) => {
      setMensagens((prev) => [
        ...prev,
        {
          msg_id:    msg.spm_id,
          texto:     msg.spm_texto,
          remetente: msg.spm_remetente,
          criado_em: msg.spm_criada_em,
        },
      ]);
      setConversas((prev) =>
        prev.map((c) =>
          c.usu_id === selectedId
            ? { ...c, ultima_mensagem: msg.spm_texto, ultima_em: msg.spm_criada_em }
            : c
        )
      );
    };

    socket.on('mensagem_suporte_recebida', handleMsg);
    return () => socket.off('mensagem_suporte_recebida', handleMsg);
  }, [socket, selectedId]);

  // ── Scroll automático ──────────────────────────────────────────────────
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mensagens]);

  // ── Envio de mensagem via HTTP (socket faz o broadcast) ───────────────
  const handleSend = async (e) => {
    e?.preventDefault();
    const texto = input.trim();
    if (!texto || sending || !selectedId) return;

    setSending(true);
    setInput('');
    try {
      await api.responderSuporte(selectedId, texto);
      // Mensagem aparece via socket broadcast — sem reload manual necessário
    } catch {
      setInput(texto); // restaura em caso de erro
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Seleciona conversa (Dev) ───────────────────────────────────────────
  const handleSelectConversa = (id) => {
    setMensagens([]);
    setSelectedId(id);
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Suporte</h1>
        <p className={styles.subtitle}>Converse com os administradores das escolas e responda dúvidas</p>
      </div>

      <div className={styles.layout}>
        {/* ── Coluna esquerda: lista de conversas ── */}
        <aside className={styles.listPane}>
          <div className={styles.listHeader}>
            <span>Conversas</span>
            <span className={styles.listCount}>{conversas.length}</span>
          </div>

          <div className={styles.list}>
            {loadingLista ? (
              <p className={styles.stateMsg}>Carregando...</p>
            ) : conversas.length === 0 ? (
              <p className={styles.stateMsg}>Nenhuma conversa por enquanto.</p>
            ) : (
              conversas.map((c) => (
                <button
                  key={c.usu_id}
                  className={`${styles.listItem} ${
                    c.usu_id === selectedId ? styles.listItemActive : ''
                  }`}
                  onClick={() => handleSelectConversa(c.usu_id)}
                >
                  <span className={styles.avatar}>{getInitials(c.admin_nome)}</span>
                  <div className={styles.listItemBody}>
                    <div className={styles.listItemTop}>
                      <span className={styles.listItemName}>{c.admin_nome}</span>
                      <span className={styles.listItemTime}>{formatHora(c.ultima_em)}</span>
                    </div>
                    <span className={styles.listItemEscola}>{c.esc_nome}</span>
                    <span className={styles.listItemPreview}>{c.ultima_mensagem}</span>
                  </div>
                  {c.nao_lidas > 0 && (
                    <span className={styles.unreadBadge}>{c.nao_lidas}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* ── Coluna direita: thread ── */}
        <section className={styles.threadPane}>
          {!selected ? (
            <div className={styles.emptyThread}>
              <IconMessage size={36} />
              <p className={styles.emptyThreadTitle}>Selecione uma conversa</p>
              <p className={styles.emptyThreadText}>
                Escolha um administrador à esquerda para ver e responder as mensagens.
              </p>
            </div>
          ) : (
            <>
              {/* Header da thread */}
              {selected && (
                <div className={styles.threadHeader}>
                  <span className={styles.avatar}>{getInitials(selected.admin_nome)}</span>
                  <div>
                    <p className={styles.threadName}>{selected.admin_nome}</p>
                    <p className={styles.threadEscola}>{selected.esc_nome}</p>
                  </div>
                </div>
              )}

              {/* Corpo das mensagens */}
              <div className={styles.threadBody} ref={bodyRef}>
                {loadingThread && mensagens.length === 0 ? (
                  <p className={styles.stateMsg}>Carregando conversa...</p>
                ) : mensagens.length === 0 ? (
                  <p className={styles.stateMsg}>Nenhuma mensagem ainda. Inicie a conversa!</p>
                ) : (
                  mensagens.map((m, i) => {
                    const anterior = i > 0 ? mensagens[i - 1] : null;
                    const mostraSeparador =
                      !anterior || !mesmoDiaCal(anterior.criado_em, m.criado_em);
                    return (
                      <Fragment key={m.msg_id}>
                        {mostraSeparador && (
                          <div className={styles.dateSeparator}>
                            <span className={styles.dateSeparatorPill}>
                              {formatDataSeparador(m.criado_em)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`${styles.row} ${
                            m.remetente === 'dev'
                              ? styles.rowMine
                              : styles.rowTheirs
                          }`}
                        >
                          <div className={styles.bubble}>
                            <p className={styles.bubbleText}>{m.texto}</p>
                            <span className={styles.bubbleTime}>{formatHora(m.criado_em)}</span>
                          </div>
                        </div>
                      </Fragment>
                    );
                  })
                )}
              </div>

              {/* Composer */}
              <form className={styles.composer} onSubmit={handleSend}>
                <textarea
                  className={styles.textarea}
                  placeholder="Escreva sua mensagem..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button
                  type="submit"
                  className={styles.sendBtn}
                  disabled={!input.trim() || sending}
                  aria-label="Enviar"
                >
                  <IconSend size={18} />
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
