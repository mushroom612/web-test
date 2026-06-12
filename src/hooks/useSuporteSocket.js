// hooks/useSuporteSocket.js — Conexão com o namespace /suporte do Socket.io  [v30]
//
// Gerencia conexão, reconexão automática e limpeza ao desmontar.
// Retorna { socket, connected } — socket é null antes de conectar.
//
// Uso:
//   const { socket, connected } = useSuporteSocket();
//   useEffect(() => {
//     if (!socket) return;
//     socket.emit('entrar_suporte', { admin_usu_id });
//     socket.on('mensagem_suporte_recebida', handler);
//     return () => socket.off('mensagem_suporte_recebida', handler);
//   }, [socket]);

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { BASE_URL, tokens } from '../services/http';

export function useSuporteSocket() {
  const [socket, setSocket]       = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const { access } = tokens.get();
    if (!access) return;

    const s = io(`${BASE_URL}/suporte`, {
      auth:                { token: access },
      reconnectionAttempts: 5,
      reconnectionDelay:    2000,
      transports:           ['websocket'],
    });

    s.on('connect',    () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, []);

  return { socket, connected };
}
