export interface AccountInfo {
  login: number;
  trade_mode: number;
  name: string;
  server: string;
  currency: string;
  leverage: number;
  limit_orders: number;
  margin_so_mode: number;
  trade_allowed: boolean;
  trade_expert: boolean;
  margin_mode: number;
  currency_digits: number;
  fifo_close: boolean;
  balance: number;
  credit: number;
  profit: number;
  equity: number;
  margin: number;
  margin_free: number;
  margin_level: number;
  margin_so_call: number;
  margin_so_so: number;
  margin_initial: number;
  margin_maintenance: number;
  assets: number;
  liabilities: number;
  commission_blocked: number;
  last_update: string;
}

export interface MT5ConnectionStatus {
  connected: boolean;
  message: string;
  terminal_info?: any;
}

export interface HealthStatus {
  status: string;
  mt5_connected: boolean;
  redis_connected: boolean;
  uptime_seconds?: number;
}

export interface WebSocketMessage {
  type: 'account_update' | 'connection_connected' | 'connection_disconnected' | 'connection_status' | 'welcome' | 'heartbeat' | 'pong' | 'ping' | 'error';
  data: AccountInfo | ConnectionStatusData | WelcomeData | HeartbeatData | PongData | string;
  timestamp?: string;
}

export interface ConnectionStatusData {
  connected: boolean;
  status?: string;
  message: string;
}

export interface WelcomeData {
  message: string;
  timestamp: string;
  server_version?: string;
}

export interface HeartbeatData {
  timestamp: string;
  connections?: number;
}

export interface PongData {
  message: string;
  timestamp: string;
}
