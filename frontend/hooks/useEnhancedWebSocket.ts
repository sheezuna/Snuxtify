'use client';

import { CONFIG, DERIVED_CONFIG } from '@/lib/config';
import {
  AccountInfo,
  ConnectionStatusData,
  WebSocketMessage,
} from '@/types/mt5';
import { useCallback, useEffect, useReducer, useRef } from 'react';

// Enhanced configuration interface
interface WebSocketConnectionConfig {
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  connectionTimeout?: number;
  enablePubSub?: boolean;
  autoSubscribe?: boolean;
}

// Enhanced hook return type
interface UseEnhancedWebSocketReturn {
  accountData: AccountInfo | null;
  marketData: Record<string, any> | null;
  positions: any[] | null;
  orders: any[] | null;
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  connectionAttempts: number;
  lastMessageTime: Date | null;
  sendMessage: (message: object) => void;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  latency: number;
}

// Enhanced state management
interface WebSocketState {
  accountData: AccountInfo | null;
  marketData: Record<string, any> | null;
  positions: any[] | null;
  orders: any[] | null;
  isConnected: boolean;
  error: string | null;
  connectionAttempts: number;
  lastMessageTime: Date | null;
  subscribedChannels: Set<string>;
  latency: number;
  messageBuffer: WebSocketMessage[];
}

// Enhanced action types
type WebSocketAction =
  | { type: 'CONNECTED' }
  | { type: 'DISCONNECTED'; reason?: string }
  | { type: 'RECONNECTING' }
  | { type: 'MESSAGE'; payload: WebSocketMessage }
  | { type: 'SUBSCRIBE'; channel: string }
  | { type: 'UNSUBSCRIBE'; channel: string }
  | { type: 'UPDATE_LATENCY'; latency: number }
  | { type: 'BATCH_UPDATE'; messages: WebSocketMessage[] };

const initialState: WebSocketState = {
  accountData: null,
  marketData: null,
  positions: null,
  orders: null,
  isConnected: false,
  error: null,
  connectionAttempts: 0,
  lastMessageTime: null,
  subscribedChannels: new Set(),
  latency: 0,
  messageBuffer: [],
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
        subscribedChannels: state.subscribedChannels, // Preserve subscriptions for reconnect
      };
    
    case 'RECONNECTING':
      return {
        ...state,
        isConnected: false,
        error: `Reconnecting... Attempt ${state.connectionAttempts + 1}.`,
        connectionAttempts: state.connectionAttempts + 1,
      };
    
    case 'MESSAGE':
      return processMessage(state, action.payload);
    
    case 'BATCH_UPDATE':
      let newState = { ...state };
      action.messages.forEach(message => {
        newState = processMessage(newState, message);
      });
      return newState;
    
    case 'SUBSCRIBE':
      return {
        ...state,
        subscribedChannels: new Set([...state.subscribedChannels, action.channel]),
      };
    
    case 'UNSUBSCRIBE':
      const newChannels = new Set(state.subscribedChannels);
      newChannels.delete(action.channel);
      return {
        ...state,
        subscribedChannels: newChannels,
      };
    
    case 'UPDATE_LATENCY':
      return {
        ...state,
        latency: action.latency,
      };
    
    default:
      return state;
  }
};

const processMessage = (state: WebSocketState, message: WebSocketMessage): WebSocketState => {
  const { type, data } = message;
  let newState = { ...state, lastMessageTime: new Date() };

  switch (type) {
    case 'account_update':
      newState.accountData = data as AccountInfo;
      break;
    
    case 'market_data':
      const marketUpdate = data as any; // Using any for flexibility
      if (marketUpdate && typeof marketUpdate === 'object' && 'symbol' in marketUpdate) {
        newState.marketData = {
          ...newState.marketData,
          [marketUpdate.symbol]: marketUpdate.data || marketUpdate,
        };
      }
      break;
    
    case 'position_update':
      const positionData = data as any;
      if (Array.isArray(positionData)) {
        newState.positions = positionData;
      } else if (positionData && 'positions' in positionData) {
        newState.positions = positionData.positions;
      }
      break;
    
    case 'order_update':
      const orderData = data as any;
      if (Array.isArray(orderData)) {
        newState.orders = orderData;
      } else if (orderData && 'orders' in orderData) {
        newState.orders = orderData.orders;
      }
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
      if (typeof data === 'string') {
        newState.error = data;
      } else if (data && typeof data === 'object' && 'message' in data) {
        newState.error = (data as { message?: string })?.message || 'Unknown server error';
      } else {
        newState.error = 'Unknown server error';
      }
      break;
    
    case 'pong':
      // Calculate latency
      if (data && typeof data === 'object' && 'timestamp' in data) {
        const timestampData = data as { timestamp?: string | number };
        if (timestampData.timestamp) {
          const timestamp = typeof timestampData.timestamp === 'string' 
            ? parseInt(timestampData.timestamp) 
            : timestampData.timestamp;
          newState.latency = Date.now() - timestamp;
        }
      }
      break;
    
    default:
      break;
  }
  
  return newState;
};

const DEFAULT_CONFIG: Required<WebSocketConnectionConfig> = {
  maxReconnectAttempts: CONFIG.WEBSOCKET.RECONNECT.MAX_ATTEMPTS,
  reconnectDelay: CONFIG.WEBSOCKET.RECONNECT.INITIAL_DELAY,
  heartbeatInterval: CONFIG.WEBSOCKET.HEARTBEAT.INTERVAL,
  connectionTimeout: CONFIG.WEBSOCKET.HEARTBEAT.TIMEOUT,
  enablePubSub: CONFIG.REALTIME.ENABLE_PUBSUB,
  autoSubscribe: CONFIG.REALTIME.AUTO_SUBSCRIBE,
};

export const useEnhancedWebSocket = (
  url: string,
  config: WebSocketConnectionConfig = {}
): UseEnhancedWebSocketReturn => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [state, dispatch] = useReducer(reducer, initialState);

  // Consolidated ref for all mutable state
  const metaRef = useRef({
    ws: null as WebSocket | null,
    timers: {
      heartbeat: null as NodeJS.Timeout | null,
      reconnect: null as NodeJS.Timeout | null,
      connection: null as NodeJS.Timeout | null,
      latencyCheck: null as NodeJS.Timeout | null,
    },
    isManualClose: false,
    connectionAttempts: 0,
    messageBuffer: [] as WebSocketMessage[],
    lastPingTime: 0,
  });

  const clearAllTimers = useCallback(() => {
    Object.values(metaRef.current.timers).forEach(timer => {
      if (timer) clearTimeout(timer);
    });
    metaRef.current.timers = {
      heartbeat: null,
      reconnect: null,
      connection: null,
      latencyCheck: null,
    };
  }, []);

  const sendMessage = useCallback((message: object) => {
    if (metaRef.current.ws?.readyState === WebSocket.OPEN) {
      metaRef.current.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not open. Message not sent:', message);
    }
  }, []);

  const subscribe = useCallback((channel: string) => {
    sendMessage({
      type: 'subscribe',
      channel: channel,
      timestamp: Date.now(),
    });
    dispatch({ type: 'SUBSCRIBE', channel });
  }, [sendMessage]);

  const unsubscribe = useCallback((channel: string) => {
    sendMessage({
      type: 'unsubscribe',
      channel: channel,
      timestamp: Date.now(),
    });
    dispatch({ type: 'UNSUBSCRIBE', channel });
  }, [sendMessage]);

  const startHeartbeat = useCallback(() => {
    metaRef.current.timers.heartbeat = setInterval(() => {
      if (metaRef.current.ws?.readyState === WebSocket.OPEN) {
        metaRef.current.lastPingTime = Date.now();
        sendMessage({
          type: 'ping',
          timestamp: metaRef.current.lastPingTime,
        });
      }
    }, finalConfig.heartbeatInterval);
  }, [finalConfig.heartbeatInterval, sendMessage]);

  const startLatencyMonitoring = useCallback(() => {
    metaRef.current.timers.latencyCheck = setInterval(() => {
      if (metaRef.current.lastPingTime > 0) {
        const timeSinceLastPing = Date.now() - metaRef.current.lastPingTime;
        if (timeSinceLastPing > finalConfig.heartbeatInterval * 2) {
          // Connection might be stale
          dispatch({ type: 'UPDATE_LATENCY', latency: -1 });
        }
      }
    }, finalConfig.heartbeatInterval / 2);
  }, [finalConfig.heartbeatInterval]);

  const autoSubscribeToChannels = useCallback(() => {
    if (!finalConfig.autoSubscribe) return;
    
    // Auto-subscribe to essential channels
    const essentialChannels = [
      CONFIG.WEBSOCKET.CHANNELS.ACCOUNT_UPDATES,
      CONFIG.WEBSOCKET.CHANNELS.POSITION_UPDATES,
      CONFIG.WEBSOCKET.CHANNELS.ORDER_UPDATES,
      CONFIG.WEBSOCKET.CHANNELS.CONNECTION_STATUS,
    ];
    
    essentialChannels.forEach(channel => {
      setTimeout(() => subscribe(channel), 100); // Slight delay to ensure connection is ready
    });
  }, [finalConfig.autoSubscribe, subscribe]);

  const connect = useCallback(() => {
    if (
      metaRef.current.ws?.readyState === WebSocket.CONNECTING ||
      metaRef.current.ws?.readyState === WebSocket.OPEN ||
      metaRef.current.connectionAttempts > finalConfig.maxReconnectAttempts
    ) {
      return;
    }

    clearAllTimers();
    metaRef.current.isManualClose = false;

    console.log(`Attempting WebSocket connection (attempt ${metaRef.current.connectionAttempts + 1})...`);

    const ws = new WebSocket(url);
    metaRef.current.ws = ws;

    metaRef.current.timers.connection = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.close(1000, 'Connection timeout');
      }
    }, finalConfig.connectionTimeout);

    ws.onopen = () => {
      console.log('Enhanced WebSocket connected with pub/sub support');
      clearAllTimers();
      metaRef.current.connectionAttempts = 0;
      
      dispatch({ type: 'CONNECTED' });
      
      startHeartbeat();
      startLatencyMonitoring();
      autoSubscribeToChannels();
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        // Handle special message types
        if (message.type === 'pong') {
          dispatch({ type: 'UPDATE_LATENCY', latency: Date.now() - metaRef.current.lastPingTime });
          return;
        }
        
        if (message.type === 'heartbeat') {
          return; // Ignore server heartbeats
        }
        
        // Buffer messages if batching is enabled
        if (CONFIG.REALTIME.BATCH_UPDATES) {
          metaRef.current.messageBuffer.push(message);
          
          // Process buffer when it reaches size limit or after timeout
          if (metaRef.current.messageBuffer.length >= CONFIG.REALTIME.BUFFER_SIZE) {
            dispatch({ type: 'BATCH_UPDATE', messages: [...metaRef.current.messageBuffer] });
            metaRef.current.messageBuffer = [];
          }
        } else {
          dispatch({ type: 'MESSAGE', payload: message });
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onclose = (event) => {
      console.log(`Enhanced WebSocket disconnected: ${event.reason}`);
      clearAllTimers();
      
      // Process any remaining buffered messages
      if (metaRef.current.messageBuffer.length > 0) {
        dispatch({ type: 'BATCH_UPDATE', messages: [...metaRef.current.messageBuffer] });
        metaRef.current.messageBuffer = [];
      }
      
      dispatch({ type: 'DISCONNECTED', reason: event.reason || 'Connection lost' });

      if (metaRef.current.isManualClose || event.code === 1000) {
        return;
      }

      // Progressive backoff with jitter
      metaRef.current.connectionAttempts += 1;
      let delay = Math.min(
        finalConfig.reconnectDelay * Math.pow(CONFIG.WEBSOCKET.RECONNECT.BACKOFF_FACTOR, metaRef.current.connectionAttempts),
        CONFIG.WEBSOCKET.RECONNECT.MAX_DELAY
      );
      
      // Add jitter to prevent thundering herd
      if (CONFIG.WEBSOCKET.RECONNECT.JITTER) {
        delay += Math.random() * 1000;
      }
      
      metaRef.current.timers.reconnect = setTimeout(() => {
        dispatch({ type: 'RECONNECTING' });
        connect();
      }, delay);
    };

    ws.onerror = (event) => {
      console.error('Enhanced WebSocket error:', event);
    };
  }, [url, finalConfig, clearAllTimers, sendMessage, startHeartbeat, startLatencyMonitoring, autoSubscribeToChannels]);

  const disconnect = useCallback(() => {
    metaRef.current.isManualClose = true;
    metaRef.current.connectionAttempts = 0;
    clearAllTimers();
    metaRef.current.ws?.close(1000, 'Manual disconnect');
    metaRef.current.ws = null;
    dispatch({ type: 'DISCONNECTED', reason: 'Manually disconnected' });
  }, [clearAllTimers]);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 100);
  }, [disconnect, connect]);

  // Buffer processing for batch updates
  useEffect(() => {
    if (!CONFIG.REALTIME.BATCH_UPDATES) return;
    
    const interval = setInterval(() => {
      if (metaRef.current.messageBuffer.length > 0) {
        dispatch({ type: 'BATCH_UPDATE', messages: [...metaRef.current.messageBuffer] });
        metaRef.current.messageBuffer = [];
      }
    }, CONFIG.REALTIME.MAX_UPDATE_FREQUENCY);
    
    return () => clearInterval(interval);
  }, []);

  // Connection lifecycle
  useEffect(() => {
    connect();
    return () => disconnect();
  }, []); // Only run on mount/unmount

  // Calculate connection quality
  const connectionQuality = state.isConnected
    ? state.latency === 0
      ? 'excellent'
      : state.latency < 100
      ? 'excellent'
      : state.latency < 300
      ? 'good'
      : 'poor'
    : 'disconnected';

  return {
    ...state,
    reconnect,
    subscribe,
    unsubscribe,
    sendMessage,
    connectionQuality,
    latency: state.latency,
  };
};
