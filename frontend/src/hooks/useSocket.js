import { useState, useEffect, useCallback, useRef } from 'react';
import { connectSocket, getSocket } from '../services/socket';

export function useSocket({ roomId, userName, keys }) {
  const [connected,    setConnected]    = useState(false);
  const [messages,     setMessages]     = useState([]);
  const [roomInfo,     setRoomInfo]     = useState(null);
  const [error,        setError]        = useState(null);
  const [connecting,   setConnecting]   = useState(false);
  const joinedRef = useRef(false);

  useEffect(() => {
    if (!roomId || !userName) return;

    setConnecting(true);
    const socket = connectSocket();

    // ── Connection events ──────────────────────────────────────────────────
    function onConnect() {
      setConnected(true);
      setConnecting(false);
      setError(null);

      if (!joinedRef.current) {
        socket.emit('join_room', { roomId, userName });
        joinedRef.current = true;
      }
    }

    function onDisconnect() {
      setConnected(false);
      joinedRef.current = false;
    }

    function onConnectError(err) {
      setConnecting(false);
      setError('No se pudo conectar al servidor. ¿Está corriendo el backend?');
      console.error('[Socket] connect_error:', err.message);
    }

    // ── Room events ────────────────────────────────────────────────────────
    function onRoomUpdate(info) {
      setRoomInfo(info);
    }

    function onMessageHistory(history) {
      setMessages(history);
    }

    function onNewMessage(msg) {
      setMessages(prev => [...prev, msg]);
    }

    function onErrorMsg({ error: errMsg }) {
      setError(errMsg);
      setTimeout(() => setError(null), 4000);
    }

    socket.on('connect',         onConnect);
    socket.on('disconnect',      onDisconnect);
    socket.on('connect_error',   onConnectError);
    socket.on('room_update',     onRoomUpdate);
    socket.on('message_history', onMessageHistory);
    socket.on('new_message',     onNewMessage);
    socket.on('error_msg',       onErrorMsg);

    // If already connected, join right away
    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect',         onConnect);
      socket.off('disconnect',      onDisconnect);
      socket.off('connect_error',   onConnectError);
      socket.off('room_update',     onRoomUpdate);
      socket.off('message_history', onMessageHistory);
      socket.off('new_message',     onNewMessage);
      socket.off('error_msg',       onErrorMsg);
    };
  }, [roomId, userName]);

  // Send keys to room when they change
  useEffect(() => {
    if (!keys || !roomId) return;
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('set_keys', { roomId, keys });
    }
  }, [keys, roomId]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback((text) => {
    if (!text.trim()) return;
    const socket = getSocket();
    if (!socket?.connected) {
      setError('Sin conexión al servidor');
      return;
    }
    socket.emit('send_message', { roomId, text });
  }, [roomId]);

  return { connected, connecting, messages, roomInfo, error, sendMessage };
}