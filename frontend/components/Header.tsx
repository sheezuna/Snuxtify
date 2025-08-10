'use client';

import { useEffect, useState } from 'react';
import Icon from './ui/Icon';
import StatusIndicator from './ui/StatusIndicator';

interface HeaderProps {
  isWebSocketConnected: boolean;
}

export default function Header({ isWebSocketConnected }: HeaderProps) {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    
    updateTime(); // Set initial time
    const interval = setInterval(updateTime, 1000); // Update every second
    
    return () => clearInterval(interval);
  }, []);
  return (
    <header className="mb-8 lg:mb-12 relative">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-2xl animate-float"></div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-pink-500/10 rounded-full blur-2xl animate-float animation-delay-1000"></div>
      </div>

      <div className="relative">
        {/* Main Header Content */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-8">
          
          {/* Brand Section */}
          <div className="flex items-start space-x-4 lg:space-x-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-2xl lg:rounded-3xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
              <div className="relative w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-2xl lg:rounded-3xl flex items-center justify-center shadow-xl transform group-hover:scale-105 transition-all duration-300">
                <Icon name="lightning" size="xl" className="text-white" />
                {/* Animated Pulse Ring */}
                <div className="absolute inset-0 rounded-2xl lg:rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 opacity-20 animate-pulse-glow"></div>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="mb-3 lg:mb-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight animate-gradient-shift">
                  Snuxtify Bot
                </h1>
                <div className="h-1 w-24 lg:w-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mt-2 lg:mt-3 animate-shimmer"></div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base lg:text-lg xl:text-xl max-w-2xl leading-relaxed mb-3 lg:mb-4">
                Professional MetaTrader 5 monitoring with advanced real-time analytics and intelligent insights
              </p>
              
              {/* Feature Badges */}
              <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                <div className="flex items-center px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-full border border-emerald-200/50 dark:border-emerald-700/30 text-xs lg:text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                  <Icon name="shield" size="xs" className="mr-1.5" />
                  Bank-Grade Security
                </div>
                <div className="flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full border border-blue-200/50 dark:border-blue-700/30 text-xs lg:text-sm text-blue-700 dark:text-blue-300 font-medium">
                  <Icon name="zap" size="xs" className="mr-1.5" />
                  Real-time Processing
                </div>
                <div className="flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full border border-purple-200/50 dark:border-purple-700/30 text-xs lg:text-sm text-purple-700 dark:text-purple-300 font-medium">
                  <Icon name="activity" size="xs" className="mr-1.5" />
                  AI-Powered Analytics
                </div>
              </div>
            </div>
          </div>
          
          {/* Status & Info Section */}
          <div className="flex flex-col lg:items-end space-y-4 lg:space-y-5 lg:text-right lg:flex-shrink-0">
            
            {/* Primary Status Indicator */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-2xl blur-lg"></div>
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-4 lg:p-5">
                <StatusIndicator
                  status={isWebSocketConnected ? 'success' : 'error'}
                  label={isWebSocketConnected ? 'Live Connection' : 'Connection Lost'}
                  size="md"
                  animated={isWebSocketConnected}
                />
                
                {/* Connection Quality Indicator */}
                <div className="mt-3 flex items-center justify-between lg:justify-end">
                  <span className="text-xs text-gray-500 dark:text-gray-400 lg:mr-2">Signal Quality</span>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((bar) => (
                      <div
                        key={bar}
                        className={`w-0.5 lg:w-1 rounded-full transition-all duration-300 ${
                          isWebSocketConnected 
                            ? bar <= 5 ? 'bg-gradient-to-t from-green-400 to-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                            : 'bg-gradient-to-t from-red-400 to-red-500'
                        }`}
                        style={{ height: `${bar * 2 + 6}px` }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* System Information Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 lg:gap-2 w-full lg:w-auto">
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-3 lg:p-4 shadow-lg">
                <div className="flex items-center lg:justify-end mb-1">
                  <Icon name="server" size="xs" className="mr-2 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Platform Status</span>
                </div>
                <div className="text-sm lg:text-base font-semibold text-gray-800 dark:text-white lg:text-right">
                  MT5 Ready
                </div>
              </div>
              
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-3 lg:p-4 shadow-lg">
                <div className="flex items-center lg:justify-end mb-1">
                  <Icon name="clock" size="xs" className="mr-2 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Local Time</span>
                </div>
                <div className="text-sm lg:text-base font-semibold text-gray-800 dark:text-white lg:text-right">
                  {isClient ? currentTime : '--:--'}
                </div>
              </div>
            </div>
            
            {/* Performance Metrics */}
            <div className="hidden lg:block">
              <div className="bg-gradient-to-br from-white/60 to-gray-50/60 dark:from-gray-800/60 dark:to-gray-700/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-4 shadow-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-right">System Performance</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">CPU</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000" style={{ width: '23%' }}></div>
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">23%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">RAM</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000" style={{ width: '67%' }}></div>
                      </div>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">67%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative Bottom Border */}
        <div className="mt-8 lg:mt-12">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
          <div className="h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent -mt-px"></div>
        </div>
      </div>
    </header>
  );
}
