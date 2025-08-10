'use client';

import Button from './ui/Button';
import Icon from './ui/Icon';
import StatusIndicator from './ui/StatusIndicator';

interface ConnectionStatusProps {
  isWebSocketConnected: boolean;
  websocketError: string | null;
  onReconnect: () => void;
}

export default function ConnectionStatus({ isWebSocketConnected, websocketError, onReconnect }: ConnectionStatusProps) {
  const connectionQuality = isWebSocketConnected ? 'excellent' : 'poor';

  return (
    <div className="relative">
      {/* Background Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 rounded-2xl blur-xl"></div>
      
      <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl p-4 lg:p-6">
        
        {/* Main Status Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
          
          {/* Primary Connection Status */}
          <div className="flex items-center space-x-4 lg:space-x-6">
            <div className="relative">
              <div className={`w-5 h-5 rounded-full ${
                isWebSocketConnected ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-red-500'
              } shadow-lg`}>
                {isWebSocketConnected && (
                  <div className="absolute inset-0 w-5 h-5 bg-green-400 rounded-full animate-ping opacity-30"></div>
                )}
              </div>
              {/* Connection Pulse Ring */}
              <div className={`absolute inset-0 w-5 h-5 rounded-full border-2 ${
                isWebSocketConnected ? 'border-green-300' : 'border-red-300'
              } animate-pulse`}></div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-1">
                <span className="text-base lg:text-lg font-semibold text-gray-800 dark:text-white">
                  Real-time Data Stream
                </span>
                <StatusIndicator
                  status={isWebSocketConnected ? 'success' : 'error'}
                  label={isWebSocketConnected ? 'Active' : 'Disconnected'}
                  size="sm"
                />
              </div>
              
              {isWebSocketConnected ? (
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center">
                    <Icon name="activity" size="xs" className="mr-1.5 text-green-500" />
                    Streaming live updates
                  </div>
                  <div className="hidden sm:flex items-center">
                    <Icon name="shield" size="xs" className="mr-1.5 text-blue-500" />
                    Encrypted connection
                  </div>
                </div>
              ) : (
                <div className="text-sm text-red-600 dark:text-red-400">
                  Connection lost - attempting to reconnect...
                </div>
              )}
            </div>
          </div>
          
          {/* Signal Strength & Controls */}
          <div className="flex items-center space-x-4 lg:space-x-6">
            
            {/* Advanced Signal Strength Indicator */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((bar) => (
                  <div
                    key={bar}
                    className={`w-1 lg:w-1.5 rounded-full transition-all duration-500 ${
                      isWebSocketConnected 
                        ? bar <= 5 ? 'bg-gradient-to-t from-green-400 to-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                        : bar <= 1 ? 'bg-gradient-to-t from-red-400 to-red-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                    style={{ height: `${bar * 3 + 8}px` }}
                  ></div>
                ))}
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize">
                {connectionQuality}
              </span>
            </div>
            
            {/* Reconnect Button */}
            {!isWebSocketConnected && (
              <Button
                variant="primary"
                size="sm"
                icon="refresh"
                onClick={onReconnect}
                className="shadow-lg hover:shadow-xl"
              >
                Reconnect
              </Button>
            )}
          </div>
        </div>
        
        {/* Error Display */}
        {websocketError && (
          <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-200/50 dark:border-red-700/30 rounded-xl">
            <div className="flex items-start space-x-3">
              <Icon name="warning" size="sm" className="text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                  Connection Error Detected
                </div>
                <div className="text-xs text-red-600 dark:text-red-400">
                  {websocketError}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Connection Metrics - Only show when connected */}
        {isWebSocketConnected && (
          <div className="mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Connection Status */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/30">
                <div className="flex items-center justify-between mb-2">
                  <Icon name="zap" size="sm" className="text-blue-600 dark:text-blue-400" />
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">STATUS</span>
                </div>
                <div className="text-lg font-bold text-blue-800 dark:text-blue-300">
                  Active
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  Real-time stream
                </div>
              </div>
              
              {/* Connection Type */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200/50 dark:border-green-700/30">
                <div className="flex items-center justify-between mb-2">
                  <Icon name="trending-up" size="sm" className="text-green-600 dark:text-green-400" />
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">TYPE</span>
                </div>
                <div className="text-lg font-bold text-green-800 dark:text-green-300">
                  WebSocket
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  Full-duplex
                </div>
              </div>
              
              {/* Security */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200/50 dark:border-purple-700/30">
                <div className="flex items-center justify-between mb-2">
                  <Icon name="shield" size="sm" className="text-purple-600 dark:text-purple-400" />
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">SECURITY</span>
                </div>
                <div className="text-lg font-bold text-purple-800 dark:text-purple-300">
                  Secure
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400">
                  Encrypted
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
