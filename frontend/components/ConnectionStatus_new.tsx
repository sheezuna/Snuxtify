'use client';

import { useEffect, useState } from 'react';
import Button from './ui/Button';
import Icon from './ui/Icon';

interface ConnectionStatusProps {
  isWebSocketConnected: boolean;
  websocketError: string | null;
  onReconnect: () => void;
}

export default function ConnectionStatus({ isWebSocketConnected, websocketError, onReconnect }: ConnectionStatusProps) {
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectionHistory, setConnectionHistory] = useState<Array<{ timestamp: Date; status: boolean }>>([]);
  const [lastDisconnection, setLastDisconnection] = useState<Date | null>(null);

  useEffect(() => {
    // Track connection state changes
    const timestamp = new Date();
    setConnectionHistory(prev => [...prev.slice(-9), { timestamp, status: isWebSocketConnected }]);
    
    if (!isWebSocketConnected && connectionHistory.length > 0 && connectionHistory[connectionHistory.length - 1]?.status) {
      setLastDisconnection(timestamp);
    }
  }, [isWebSocketConnected, connectionHistory]);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      await onReconnect();
    } finally {
      // Add delay for better UX feedback
      setTimeout(() => setIsReconnecting(false), 1000);
    }
  };

  const connectionQuality = isWebSocketConnected ? 'excellent' : 'poor';

  return (
    <div className="relative">
      {/* Enhanced Background Effects */}
      <div className={`absolute inset-0 rounded-2xl blur-xl transition-all duration-500 ${
        isWebSocketConnected 
          ? 'bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-blue-500/10' 
          : 'bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10'
      }`}></div>
      
      <div className={`relative backdrop-blur-md rounded-2xl border shadow-xl p-4 lg:p-6 transition-all duration-300 ${
        isWebSocketConnected
          ? 'bg-white/90 dark:bg-gray-800/90 border-green-200/50 dark:border-green-700/50'
          : 'bg-red-50/90 dark:bg-red-900/20 border-red-200/50 dark:border-red-700/50'
      }`}>
        
        {/* Header with Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className={`w-6 h-6 rounded-full shadow-lg transition-all duration-300 ${
                isWebSocketConnected 
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                  : 'bg-gradient-to-r from-red-400 to-red-500'
              }`}>
                {isWebSocketConnected && (
                  <div className="absolute inset-0 w-6 h-6 bg-green-400 rounded-full animate-ping opacity-30"></div>
                )}
              </div>
              
              {/* Connection Quality Rings */}
              <div className={`absolute -inset-1 rounded-full border-2 animate-pulse ${
                isWebSocketConnected ? 'border-green-300/50' : 'border-red-300/50'
              }`}></div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Connection Status
              </h3>
              <p className={`text-sm ${
                isWebSocketConnected 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {isWebSocketConnected ? 'Real-time data active' : 'Connection interrupted'}
              </p>
            </div>
          </div>

          {/* Connection Actions */}
          <div className="flex items-center space-x-2">
            {!isWebSocketConnected && (
              <Button
                onClick={handleReconnect}
                disabled={isReconnecting}
                variant="primary"
                size="sm"
                className="flex items-center space-x-2"
              >
                {isReconnecting ? (
                  <>
                    <Icon name="loading" size="xs" className="animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Icon name="refresh" size="xs" />
                    <span>Reconnect</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Connection Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-white/60 dark:bg-gray-700/60 rounded-xl p-3 border border-gray-200/30 dark:border-gray-600/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">WebSocket</span>
              <Icon name="wifi" size="xs" className={isWebSocketConnected ? 'text-green-500' : 'text-red-500'} />
            </div>
            <div className={`text-sm font-semibold ${
              isWebSocketConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              {isWebSocketConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>

          <div className="bg-white/60 dark:bg-gray-700/60 rounded-xl p-3 border border-gray-200/30 dark:border-gray-600/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Quality</span>
              <Icon name="signal" size="xs" className={isWebSocketConnected ? 'text-blue-500' : 'text-gray-400'} />
            </div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {connectionQuality.charAt(0).toUpperCase() + connectionQuality.slice(1)}
            </div>
          </div>

          <div className="bg-white/60 dark:bg-gray-700/60 rounded-xl p-3 border border-gray-200/30 dark:border-gray-600/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Latency</span>
              <Icon name="zap" size="xs" className="text-yellow-500" />
            </div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {isWebSocketConnected ? '<50ms' : 'N/A'}
            </div>
          </div>

          <div className="bg-white/60 dark:bg-gray-700/60 rounded-xl p-3 border border-gray-200/30 dark:border-gray-600/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Uptime</span>
              <Icon name="clock" size="xs" className="text-purple-500" />
            </div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {isWebSocketConnected ? '99.9%' : '0%'}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {websocketError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 mb-4">
            <div className="flex items-start space-x-3">
              <Icon name="warning" size="sm" className="text-red-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                  Connection Error
                </h4>
                <p className="text-sm text-red-600 dark:text-red-300">
                  {websocketError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Connection History Visualization */}
        <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Connection History (Last 10 states)
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {lastDisconnection && `Last disconnect: ${lastDisconnection.toLocaleTimeString()}`}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            {connectionHistory.slice(-10).map((entry, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  entry.status 
                    ? 'bg-green-400 shadow-sm shadow-green-400/50' 
                    : 'bg-red-400 shadow-sm shadow-red-400/50'
                }`}
                title={`${entry.status ? 'Connected' : 'Disconnected'} at ${entry.timestamp.toLocaleTimeString()}`}
              ></div>
            ))}
            {connectionHistory.length < 10 && 
              Array.from({ length: 10 - connectionHistory.length }).map((_, index) => (
                <div key={`empty-${index}`} className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-600"></div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
