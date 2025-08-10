'use client';

import {
  AccountInfo,
  ConnectionStatusData,
  WebSocketMessage,
} from '@/types/mt5';
import { useCallback, useEffect, useReducer, useRef } from 'react';

// Simplified configuration interface
interface WebSocketConnectionConfig {
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  connectionTimeout?: number;
}

// Hook return type
interface UseWebSocketReturn {
  accountData: AccountInfo | null;
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
  connectionAttempts: number;
  lastMessageTime: Date | null;
  sendMessage: (message: object) => void;
}

// State management with useReducer
interface WebSocketState {
  accountData: AccountInfo | null;
  isConnected: boolean;
  error: string | null;
  connectionAttempts: number;
  lastMessageTime: Date | null;
}

// Minimalistic action types
type WebSocketAction =
  | { type: 'CONNECTED' }
  | { type: 'DISCONNECTED'; reason?: string }
  | { type: 'RECONNECTING' }
  | { type: 'MESSAGE'; payload: WebSocketMessage };

const initialState: WebSocketState = {
  accountData: null,
  isConnected: false,
  error: null,
  connectionAttempts: 0,
  lastMessageTime: null,
};

const reducer = (state: WebSocketState, action: WebSocketAction): WebSocketState => {
  switch (action.type) {
    case 'CONNECTED':
      return {
        ...state,
        isConnected: true,
        error: null,
        connectionAttempts: 0,
        lastMessageTime: new Date(),
      };
    case 'DISCONNECTED':
      return {
        ...initialState,
        error: action.reason || 'Connection lost.',
      };
    case 'RECONNECTING':
      const newAttempts = state.connectionAttempts + 1;
      return {
        ...state,
        isConnected: false,
        error: `Reconnecting... Attempt ${newAttempts}.`,
        connectionAttempts: newAttempts,
      };
    case 'MESSAGE':
      const { type, data } = action.payload;
      let newState = { ...state, lastMessageTime: new Date() };

      switch (type) {
        case 'account_update':
          newState.accountData = data as AccountInfo;
          break;
        case 'connection_status':
        case 'connection_connected':
          const statusData = data as ConnectionStatusData;
          newState.error = statusData?.connected ? null : statusData?.message || 'Connection status unknown';
          break;
        case 'connection_disconnected':
          newState.error = 'MT5 connection lost';
          break;
        case 'error':
          newState.error = (data as { message?: string })?.message || 'Unknown server error';
          break;
        default:
          break; // Unhandled message types
      }
      return newState;
    default:
      return state;
  }
};

const DEFAULT_CONFIG: Required<WebSocketConnectionConfig> = {
  maxReconnectAttempts: 5,
  reconnectDelay: 2000,
  heartbeatInterval: 30000,
  connectionTimeout: 10000,
};

export const useWebSocket = (
  url: string,
  config: WebSocketConnectionConfig = {}
): UseWebSocketReturn => {
  const {
    maxReconnectAttempts,
    reconnectDelay,
    heartbeatInterval,
    connectionTimeout,
  } = { ...DEFAULT_CONFIG, ...config };

  const [state, dispatch] = useReducer(reducer, initialState);

  // Consolidated ref for all mutable state
  const metaRef = useRef({
    ws: null as WebSocket | null,
    timers: {
      heartbeat: null as NodeJS.Timeout | null,
      reconnect: null as NodeJS.Timeout | null,
      connection: null as NodeJS.Timeout | null,
    },
    isManualClose: false,
  });

  const clearAllTimers = useCallback(() => {
    if (metaRef.current.timers.reconnect) clearTimeout(metaRef.current.timers.reconnect);
    if (metaRef.current.timers.heartbeat) clearInterval(metaRef.current.timers.heartbeat);
    if (metaRef.current.timers.connection) clearTimeout(metaRef.current.timers.connection);
  }, []);

  const sendMessage = useCallback((message: object) => {
    if (metaRef.current.ws?.readyState === WebSocket.OPEN) {
      metaRef.current.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not open. Message not sent:', message);
    }
  }, []);

  const connect = useCallback(() => {
    // Abort if already connecting/connected or max attempts reached
    if (
      metaRef.current.ws?.readyState === WebSocket.CONNECTING ||
      metaRef.current.ws?.readyState === WebSocket.OPEN ||
      state.connectionAttempts > maxReconnectAttempts
    ) {
      return;
    }

    clearAllTimers();
    metaRef.current.isManualClose = false;

    console.log(`Attempting connection (attempt ${state.connectionAttempts + 1})...`);

    const ws = new WebSocket(url);
    metaRef.current.ws = ws;

    metaRef.current.timers.connection = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'Connection timeout');
      }
    }, connectionTimeout);

    ws.onopen = () => {
      console.log('WebSocket connected.');
      clearAllTimers();
      dispatch({ type: 'CONNECTED' });
      metaRef.current.timers.heartbeat = setInterval(() => {
        sendMessage({ type: 'ping', timestamp: Date.now() });
      }, heartbeatInterval);
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        if (message.type !== 'pong' && message.type !== 'heartbeat') {
          dispatch({ type: 'MESSAGE', payload: message });
        }
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    };

    ws.onclose = (event) => {
      console.log(`WebSocket disconnected: ${event.reason}`);
      clearAllTimers();
      dispatch({ type: 'DISCONNECTED', reason: event.reason || 'Connection lost' });

      if (metaRef.current.isManualClose || event.code === 1000) {
        return;
      }

      const delay = Math.min(reconnectDelay * Math.pow(2, state.connectionAttempts), 30000);
      metaRef.current.timers.reconnect = setTimeout(() => {
        dispatch({ type: 'RECONNECTING' });
        connect();
      }, delay);
    };

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      // onclose will be called after onerror, no redundant logic needed.
    };
  }, [url, state.connectionAttempts, maxReconnectAttempts, reconnectDelay, connectionTimeout, clearAllTimers, sendMessage, heartbeatInterval]);

  const disconnect = useCallback(() => {
    metaRef.current.isManualClose = true;
    clearAllTimers();
    metaRef.current.ws?.close(1000, 'Manual disconnect');
    metaRef.current.ws = null;
    dispatch({ type: 'DISCONNECTED', reason: 'Manually disconnected' });
  }, [clearAllTimers]);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 100);
  }, [disconnect, connect]);

  // Mount/Unmount lifecycle
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    ...state,
    reconnect,
    sendMessage,
  };
};