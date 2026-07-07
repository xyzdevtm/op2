import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface LiveStats {
  playerId: string;
  kills?: number;
  deaths?: number;
  tiles?: number;
  gold?: number;
  gameMode?: string;
  isAlive?: boolean;
  timestamp: number;
}

const WS_URL = import.meta.env.VITE_PANEL_WS_URL || `ws://${window.location.hostname}:4000`;

export function useLiveStats(userId: string | null) {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('stats_update', (data: LiveStats) => {
      setStats(data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  const clearStats = useCallback(() => {
    setStats(null);
  }, []);

  return { stats, connected, clearStats };
}
