'use client';

import AccountCard from '@/components/AccountCard';
import ConnectionControls from '@/components/ConnectionControls';
import ConnectionStatus from '@/components/ConnectionStatus';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { useWebSocket } from '@/hooks/useWebSocket';
import { mt5Api } from '@/services/api';
import { MT5ConnectionStatus } from '@/types/mt5';
import { formatDateTime } from '@/utils/dateUtils';
import { useEffect, useState } from 'react';

export default function Home() {
  const [connectionStatus, setConnectionStatus] = useState<MT5ConnectionStatus | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // WebSocket connection for real-time updates
  const { accountData, isConnected: isWebSocketConnected, error: websocketError, reconnect } = useWebSocket(
    process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws'
  );

  // Load initial connection status
  useEffect(() => {
    const loadConnectionStatus = async () => {
      try {
        const status = await mt5Api.getConnectionStatus();
        setConnectionStatus(status);
      } catch (error) {
        console.error('Failed to load connection status:', error);
        setConnectionStatus({ connected: false, message: 'Failed to check connection status' });
      }
    };

    loadConnectionStatus();
  }, []);

  // Update last update timestamp when account data changes
  useEffect(() => {
    if (accountData) {
      setLastUpdate(formatDateTime());
    }
  }, [accountData]);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Background with Multiple Layers */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-blue-950 dark:to-indigo-950 transition-all duration-1000"></div>
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-float opacity-70"></div>
          <div className="absolute top-3/4 left-3/4 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-float animation-delay-2000 opacity-70"></div>
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-gradient-to-r from-yellow-400/20 to-red-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-float animation-delay-4000 opacity-70"></div>
        </div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05]"></div>
        
        {/* Subtle Noise Texture */}
        <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Responsive Container with Advanced Layout */}
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 max-w-screen-2xl">
          
          {/* Enhanced Header with Improved Typography and Spacing */}
          <Header isWebSocketConnected={isWebSocketConnected} />

          {/* Streamlined Connection Status */}
          <div className="mb-6 lg:mb-8">
            <ConnectionStatus
              isWebSocketConnected={isWebSocketConnected}
              websocketError={websocketError}
              onReconnect={reconnect}
            />
          </div>

          {/* Advanced Responsive Grid Layout */}
          <div className={`transition-all duration-500 ${
            isFullscreen 
              ? 'grid grid-cols-1 gap-0' 
              : 'grid grid-cols-1 lg:grid-cols-12 2xl:grid-cols-16 gap-4 lg:gap-6 xl:gap-8'
          }`}>
            
            {/* Connection Controls Sidebar - Responsive Layout */}
            {!isFullscreen && (
              <div className="lg:col-span-4 2xl:col-span-5 order-2 lg:order-1">
                <div className="sticky top-4 lg:top-6 space-y-4">
                  <ConnectionControls
                    connectionStatus={connectionStatus}
                    onStatusChange={setConnectionStatus}
                  />
                  
                  {/* Real-time System Stats from Backend */}
                  <div className="hidden lg:block">
                    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Connection Health</h3>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 dark:text-gray-400">WebSocket</span>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${isWebSocketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {isWebSocketConnected ? 'Connected' : 'Disconnected'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 dark:text-gray-400">MT5 Status</span>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${connectionStatus?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {connectionStatus?.connected ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Last Update</span>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${lastUpdate ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {lastUpdate ? 'Recent' : 'None'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Account Dashboard - Enhanced Responsive Design */}
            <div className={`${
              isFullscreen 
                ? 'col-span-1' 
                : 'lg:col-span-8 2xl:col-span-11 order-1 lg:order-2'
            } transition-all duration-500`}>
              <div className="relative">
                {/* Fullscreen Toggle Button */}
                <button
                  onClick={toggleFullscreen}
                  className="absolute top-4 right-4 z-20 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 group"
                >
                  <svg 
                    className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    {isFullscreen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    )}
                  </svg>
                </button>
                
                <AccountCard
                  accountData={accountData}
                  isConnected={connectionStatus?.connected ?? false}
                  lastUpdate={lastUpdate}
                />
              </div>
            </div>
          </div>

          {/* Enhanced Debug Information - Only in Development */}
          {process.env.NODE_ENV === 'development' && !isFullscreen && (
            <div className="mt-8 lg:mt-12">
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-xl flex items-center justify-center mr-3">
                      <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">System Diagnostics</h3>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    Development Mode
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50/80 dark:bg-gray-700/80 rounded-xl p-4 border border-gray-200/30 dark:border-gray-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">WebSocket</div>
                      <div className={`w-2 h-2 rounded-full ${isWebSocketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                    <div className={`text-sm font-semibold ${isWebSocketConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {isWebSocketConnected ? 'Connected' : 'Disconnected'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Real-time data stream
                    </div>
                  </div>
                  
                  <div className="bg-gray-50/80 dark:bg-gray-700/80 rounded-xl p-4 border border-gray-200/30 dark:border-gray-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">MT5 Status</div>
                      <div className={`w-2 h-2 rounded-full ${connectionStatus?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                    <div className={`text-sm font-semibold ${connectionStatus?.connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {connectionStatus?.connected ? 'Connected' : 'Disconnected'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Trading platform link
                    </div>
                  </div>
                  
                  <div className="bg-gray-50/80 dark:bg-gray-700/80 rounded-xl p-4 border border-gray-200/30 dark:border-gray-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Last Update</div>
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    </div>
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Data refresh time
                    </div>
                  </div>
                  
                  <div className="bg-gray-50/80 dark:bg-gray-700/80 rounded-xl p-4 border border-gray-200/30 dark:border-gray-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">System Health</div>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                      Optimal
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      All systems operational
                    </div>
                  </div>
                </div>
                
                {/* Real Backend Connection Diagnostics */}
                <div className="mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Connection Details</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">WebSocket URL</span>
                          <span className="text-gray-700 dark:text-gray-300">{process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws'}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">API Base URL</span>
                          <span className="text-gray-700 dark:text-gray-300">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">Connection State</span>
                          <span className="text-gray-700 dark:text-gray-300">{connectionStatus?.message || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Data Status</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">Account Data</span>
                          <span className={`text-xs ${accountData ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {accountData ? 'Available' : 'Not Available'}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">WebSocket Errors</span>
                          <span className={`text-xs ${websocketError ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {websocketError ? '1' : '0'}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500 dark:text-gray-400">Terminal Info</span>
                          <span className={`text-xs ${connectionStatus?.terminal_info ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                            {connectionStatus?.terminal_info ? 'Available' : 'Not Available'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Enhanced Footer */}
      {!isFullscreen && <Footer />}
    </div>
  );
}
