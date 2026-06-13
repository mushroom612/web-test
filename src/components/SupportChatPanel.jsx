// ============================================================
// components/SupportChatPanel.jsx — Chat de suporte do Admin
//
// Painel flutuante ancorado no topo-direita (abre a partir do
// botão de suporte na Topbar). É a forma do Admin (per_tipo=1)
// conversar com o Desenvolvedor numa única thread contínua.
//
// Funcionamento:
//   - Ao abrir, carrega a thread (api.getMinhaThreadSuporte) e
//     marca como lidas as mensagens do Dev.
//   - Faz polling a cada 6s enquanto aberto para puxar respostas
//     novas (o backend real é REST; não há WebSocket).
//   - Envia mensagens via api.enviarMensagemSuporte.
//
// Observação: a camada de dados ainda é mockada (data/supportMock.js
// via services/api.js). Trocar o mock pelo backend não exige mudar
// este componente.
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { Send, X, LifeBuoy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import styles from './SupportChatPanel.module.css';

const POLL_MS = 6000;

// formatHora: rótulo curto e amigável para cada mensagem.
// Hoje → "14:32"; outro dia → "12/06 14:32".
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

export function SupportChatPanel({ onClose }) {
  const { user } = useAuth();

  // admin: dados que o mock usa para identificar a thread.
  // No backend real isso vem do JWT — aqui montamos a partir do /me.
  const admin = {
    usu_id: user?.usu_id,
    admin_nome: user?.usu_nome || 'Administrador',
    esc_nome: user?.esc_nome || '—'
  };

  const [mensagens, setMensagens] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  // scrollToBottom: mantém a conversa rolada na última mensagem.
  const scrollToBottom = useCallback(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // load: busca a thread e (na primeira carga) marca as mensagens
  // do Dev como lidas. silent=true evita o "piscar" do loading no polling.
  const load = useCallback(
    async (silent = false) => {
      if (!admin.usu_id) return;
      if (!silent) setLoading(true);
      try {
        const data = await api.getMinhaThreadSuporte(admin);
        setMensagens(data?.mensagens || []);
        await api.marcarLidasSuporte({ usuId: admin.usu_id, leitor: 'admin' });
      } catch {
        // silencioso: o painel apenas não atualiza nesta rodada
      } finally {
        if (!silent) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [admin.usu_id]
  );

  // Carrega ao montar + foca o input.
  useEffect(() => {
    load();
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [load]);

  // Polling enquanto o painel está aberto.
  useEffect(() => {
    const id = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  // Rola para o fim sempre que chegam mensagens novas.
  useEffect(() => {
    scrollToBottom();
  }, [mensagens, scrollToBottom]);

  // handleSend: envia a mensagem e recarrega a thread.
  const handleSend = async (e) => {
    e?.preventDefault();
    const texto = input.trim();
    if (!texto || sending) return;
    setSending(true);
    setInput('');
    try {
      await api.enviarMensagemSuporte(texto, admin);
      await load(true);
    } catch {
      // devolve o texto ao campo para o usuário tentar de novo
      setInput(texto);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Enter envia; Shift+Enter quebra linha.
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.panel} role="dialog" aria-label="Suporte ao desenvolvedor">
      {/* Cabeçalho */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <span className={styles.headerIcon}>
            <LifeBuoy size={16} />
          </span>
          <div>
            <p className={styles.headerName}>Suporte ao desenvolvedor</p>
            <p className={styles.headerHint}>Tire dúvidas ou relate um problema</p>
          </div>
        </div>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
          <X size={18} />
        </button>
      </div>

      {/* Corpo: mensagens */}
      <div className={styles.body} ref={bodyRef}>
        {loading ? (
          <p className={styles.stateMsg}>Carregando conversa...</p>
        ) : mensagens.length === 0 ? (
          <div className={styles.emptyState}>
            <LifeBuoy size={28} />
            <p className={styles.emptyTitle}>Nenhuma mensagem ainda</p>
            <p className={styles.emptyText}>
              Mande sua primeira mensagem para a equipe de desenvolvimento.
            </p>
          </div>
        ) : (
          mensagens.map((m) => (
            <div
              key={m.msg_id}
              className={`${styles.row} ${
                m.remetente === 'admin' ? styles.rowMine : styles.rowTheirs
              }`}
            >
              <div className={styles.bubble}>
                <p className={styles.bubbleText}>{m.texto}</p>
                <span className={styles.bubbleTime}>{formatHora(m.criado_em)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rodapé: campo de envio */}
      <form className={styles.composer} onSubmit={handleSend}>
        <textarea
          ref={inputRef}
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
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
