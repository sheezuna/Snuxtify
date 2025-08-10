'use client';

import { useState } from 'react';
import { mt5Api } from '@/services/api';
import { MT5ConnectionStatus } from '@/types/mt5';
import Button from './ui/Button';
import StatusIndicator from './ui/StatusIndicator';
import Icon from './ui/Icon';
import MetricCard from './ui/MetricCard';

interface ConnectionControlsProps {
  connectionStatus: MT5ConnectionStatus | null;
  onStatusChange: (status: MT5ConnectionStatus) => void;
}

// Connection Status Display Component
const ConnectionStatusBadge = ({ isConnected, message }: { isConnected: boolean; message?: string }) => (
  <div className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 ${
    isConnected 
      ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200/50 dark:from-emerald-900/20 dark:to-green-900/20 dark:border-emerald-700/30' 
      : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200/50 dark:from-red-900/20 dark:to-rose-900/20 dark:border-red-700/30'
  }`}>
    <div className="flex items-center">
      <div className={`w-3 h-3 rounded-full mr-3 shadow-sm ${
        isConnected 
          ? 'bg-emerald-500 animate-pulse shadow-emerald-500/50' 
          : 'bg-red-500 shadow-red-500/50'
      }`} />
      <div>
        <span className={`font-semibold text-sm ${
          isConnected 
            ? 'text-emerald-800 dark:text-emerald-300' 
            : 'text-red-800 dark:text-red-300'
        }`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
        {message && (
          <p className={`text-xs mt-0.5 ${
            isConnected 
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {message}
          </p>
        )}
      </div>
    </div>
    <StatusIndicator 
      status={isConnected ? 'success' : 'error'} 
      label={isConnected ? 'Live' : 'Offline'} 
      size="sm"
    />
  </div>
);

// Quick Actions Component
const QuickActions = ({ onRefresh, onSettings }: { onRefresh: () => void; onSettings: () => void }) => (
  <div className="grid grid-cols-2 gap-3">
    <Button
      variant="ghost"
      size="sm"
      icon="refresh"
      onClick={onRefresh}
      className="justify-center"
    >
      Refresh
    </Button>
    <Button
      variant="ghost"
      size="sm"
      icon="settings"
      onClick={onSettings}
      className="justify-center"
    >
      Settings
    </Button>
  </div>
);

// Terminal Info Component
const TerminalInfo = ({ terminalInfo }: { terminalInfo: Record<string, any> }) => (
  <div className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/30">
    <div className="flex items-center mb-3">
      <div className="w-6 h-6 bg-slate-500/20 rounded-lg flex items-center justify-center mr-2">
        <Icon name="server" size="xs" className="text-slate-600 dark:text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Terminal Info</h3>
    </div>
    <div className="space-y-2">
      {Object.entries(terminalInfo).slice(0, 4).map(([key, value]) => (
        <div key={key} className="flex justify-between items-center text-xs">
          <span className="text-gray-500 dark:text-gray-400 capitalize">
            {key.replace(/_/g, ' ')}
          </span>
          <span className="font-medium text-gray-700 dark:text-gray-300 truncate ml-2 max-w-[60%]">
            {String(value)}
          </span>
        </div>
      ))}
    </div>
  </div>
);

// Connection Stats Component
const ConnectionStats = ({ isConnected }: { isConnected: boolean }) => (
  <div className="grid grid-cols-2 gap-4">
    <MetricCard
      title="Uptime"
      value={isConnected ? '99.9%' : '0%'}
      icon="clock"
      color={isConnected ? 'green' : 'gray'}
      size="sm"
    />
    <MetricCard
      title="Latency"
      value={isConnected ? '<1ms' : '--'}
      icon="activity"
      color={isConnected ? 'blue' : 'gray'}
      size="sm"
    />
  </div>
);

export default function ConnectionControls({ connectionStatus, onStatusChange }: ConnectionControlsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReconnect = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const status = await mt5Api.reconnectMT5();
      onStatusChange(status);
      
      if (!status.connected) {
        setError(status.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reconnect to MT5';
      setError(errorMessage);
      onStatusChange({ connected: false, message: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const status = await mt5Api.getConnectionStatus();
      onStatusChange(status);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get connection status';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Note: Connect/Disconnect functionality is handled by the reconnect endpoint
  // The backend doesn't have separate connect/disconnect endpoints
  const handleConnect = () => {
    handleReconnect();
  };

  const handleDisconnect = () => {
    // Since there's no disconnect endpoint, we just refresh the status
    // The backend handles connection management internally
    handleRefreshStatus();
  };

  const handleSettings = () => {
    // Settings functionality not available in backend
    alert('Settings functionality is not available in the current backend implementation.');
  };

  const isConnected = connectionStatus?.connected ?? false;

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-6 sm:p-8 space-y-6">
      {/* Header with Icon */}
      <div className="flex items-center">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
          <Icon name="connection" size="md" className="text-white" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">MT5 Connection</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your MetaTrader 5 connection</p>
        </div>
      </div>
      
      {/* Connection Status */}
      <ConnectionStatusBadge 
        isConnected={isConnected} 
        message={connectionStatus?.message}
      />

      {/* Error Message */}
      {error && (
        <StatusIndicator 
          status="error" 
          label={error} 
          className="w-full justify-start p-3 rounded-lg"
        />
      )}

      {/* Main Action Button */}
      <div className="space-y-4">
        {!isConnected ? (
          <Button
            variant="primary"
            size="lg"
            icon="lightning"
            loading={isLoading}
            onClick={handleConnect}
            fullWidth
            className="py-4"
          >
            {isLoading ? 'Connecting...' : 'Connect to MT5'}
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="lg"
            icon="refresh"
            loading={isLoading}
            onClick={handleReconnect}
            fullWidth
            className="py-4"
          >
            {isLoading ? 'Reconnecting...' : 'Reconnect'}
          </Button>
        )}
        
        {/* Quick Actions */}
        <QuickActions onRefresh={handleRefreshStatus} onSettings={handleSettings} />
      </div>

      {/* Terminal Information */}
      {connectionStatus?.terminal_info && (
        <TerminalInfo terminalInfo={connectionStatus.terminal_info} />
      )}

      {/* Connection Stats */}
      <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
        <ConnectionStats isConnected={isConnected} />
      </div>
    </div>
  );
}
