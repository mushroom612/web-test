// ============================================================
// pages/Suporte.jsx — Caixa de entrada de suporte (Desenvolvedor)
//
// Página exclusiva do Dev (per_tipo=2). Lista todas as conversas
// de suporte (uma por admin/escola) à esquerda e a thread aberta
// à direita, no estilo de uma caixa de entrada de mensagens.
//
// Funcionamento:
//   - Carrega a lista de conversas (api.getConversasSuporte) e faz
//     polling a cada 8s para refletir novas mensagens dos admins.
//   - Ao selecionar uma conversa, carrega a thread e marca as
//     mensagens do admin como lidas.
//   - Responde via api.responderSuporte.
//
// Camada de dados ainda mockada (data/supportMock.js via api.js).
// Estilo: Suporte.module.css
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { api } from '../services/api';
import styles from './Suporte.module.css';

const LISTA_POLL_MS = 8000;
const THREAD_POLL_MS = 6000;

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
  const dm = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${dm} ${hhmm}`;
}

export function Suporte() {
  const [conversas, setConversas] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [input, setInput] = useState('');
  const [loadingLista, setLoadingLista] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);

  const bodyRef = useRef(null);

  const selected = conversas.find((c) => c.usu_id === selectedId) || null;

  // ── Lista de conversas ──────────────────────────────────
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
    const id = setInterval(() => loadLista(true), LISTA_POLL_MS);
    return () => clearInterval(id);
  }, [loadLista]);

  // ── Thread selecionada ──────────────────────────────────
  const loadThread = useCallback(
    async (usuId, silent = false) => {
      if (!usuId) return;
      if (!silent) setLoadingThread(true);
      try {
        const data = await api.getThreadSuporte(usuId);
        setMensagens(data?.mensagens || []);
        await api.marcarLidasSuporte({ usuId, leitor: 'dev' });
        // Atualiza a lista para zerar o badge da conversa lida
        loadLista(true);
      } catch {
        // silencioso
      } finally {
        if (!silent) setLoadingThread(false);
      }
    },
    [loadLista]
  );

  // Recarrega a thread ao trocar de conversa + polling.
  useEffect(() => {
    if (selectedId == null) return;
    loadThread(selectedId);
    const id = setInterval(() => loadThread(selectedId, true), THREAD_POLL_MS);
    return () => clearInterval(id);
  }, [selectedId, loadThread]);

  // Rola para a última mensagem.
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mensagens]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const texto = input.trim();
    if (!texto || sending || selectedId == null) return;
    setSending(true);
    setInput('');
    try {
      await api.responderSuporte(selectedId, texto);
      await loadThread(selectedId, true);
    } catch {
      setInput(texto);
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Suporte</h1>
        <p className={styles.subtitle}>
          Converse com os administradores das escolas e responda dúvidas
        </p>
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
                  onClick={() => setSelectedId(c.usu_id)}
                >
                  <span className={styles.avatar}>{getInitials(c.admin_nome)}</span>
                  <div className={styles.listItemBody}>
                    <div className={styles.listItemTop}>
                      <span className={styles.listItemName}>{c.admin_nome}</span>
                      <span className={styles.listItemTime}>
                        {formatHora(c.ultima_em)}
                      </span>
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
              <MessageSquare size={36} />
              <p className={styles.emptyThreadTitle}>Selecione uma conversa</p>
              <p className={styles.emptyThreadText}>
                Escolha um administrador à esquerda para ver e responder as mensagens.
              </p>
            </div>
          ) : (
            <>
              <div className={styles.threadHeader}>
                <span className={styles.avatar}>{getInitials(selected.admin_nome)}</span>
                <div>
                  <p className={styles.threadName}>{selected.admin_nome}</p>
                  <p className={styles.threadEscola}>{selected.esc_nome}</p>
                </div>
              </div>

              <div className={styles.threadBody} ref={bodyRef}>
                {loadingThread && mensagens.length === 0 ? (
                  <p className={styles.stateMsg}>Carregando conversa...</p>
                ) : (
                  mensagens.map((m) => (
                    <div
                      key={m.msg_id}
                      className={`${styles.row} ${
                        m.remetente === 'dev' ? styles.rowMine : styles.rowTheirs
                      }`}
                    >
                      <div className={styles.bubble}>
                        <p className={styles.bubbleText}>{m.texto}</p>
                        <span className={styles.bubbleTime}>
                          {formatHora(m.criado_em)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form className={styles.composer} onSubmit={handleSend}>
                <textarea
                  className={styles.textarea}
                  placeholder="Escreva sua resposta..."
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
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
