import { AccountInfo, MT5ConnectionStatus, HealthStatus } from '@/types/mt5';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const mt5Api = {
  // System endpoints
  getSystemInfo: async () => {
    const response = await api.get('/');
    return response.data;
  },

  // Health check
  getHealthStatus: async (): Promise<HealthStatus> => {
    const response = await api.get('/health');
    return response.data;
  },

  // MT5 Connection - Only available endpoints
  getConnectionStatus: async (): Promise<MT5ConnectionStatus> => {
    const response = await api.get('/connection-status');
    return response.data;
  },

  reconnectMT5: async (): Promise<MT5ConnectionStatus> => {
    const response = await api.post('/reconnect');
    return response.data;
  },

  // Account Info
  getAccountInfo: async (): Promise<AccountInfo> => {
    const response = await api.get('/account');
    return response.data;
  },
};

export default api;
