'use client';

import { useEnhancedWebSocket } from '@/hooks/useEnhancedWebSocket';
import { CONFIG } from '@/lib/config';
import { AccountInfo } from '@/types/mt5';
import { formatDateTime } from '@/utils/dateUtils';
import { memo, useCallback, useMemo, useState } from 'react';

// Optimized UI Components
const StatusIndicator = memo(({ 
  status, 
  label, 
  size = 'sm' 
}: { 
  status: 'success' | 'warning' | 'error' | 'neutral';
  label: string;
  size?: 'xs' | 'sm' | 'md';
}) => {
  const statusColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500',
    neutral: 'bg-slate-400'
  };
  
  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4'
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className={`rounded-full ${statusColors[status]} ${sizeClasses[size]} animate-pulse`} />
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
    </div>
  );
});

StatusIndicator.displayName = 'StatusIndicator';

const MetricCard = memo(({ 
  title, 
  value, 
  subtitle, 
  trend, 
  status = 'neutral' 
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'success' | 'warning' | 'error' | 'neutral';
}) => {
  const trendIcon = {
    up: '↗',
    down: '↘',
    stable: '→'
  };
  
  const trendColor = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-red-600 dark:text-red-400',
    stable: 'text-slate-600 dark:text-slate-400'
  };
  
  return (
    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</h3>
        {trend && (
          <span className={`text-lg ${trendColor[trend]}`}>
            {trendIcon[trend]}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
        {value}
      </div>
      {subtitle && (
        <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      )}
    </div>
  );
});

MetricCard.displayName = 'MetricCard';

const ConnectionQualityIndicator = memo(({ 
  quality, 
  latency 
}: { 
  quality: 'excellent' | 'good' | 'poor' | 'disconnected';
  latency: number;
}) => {
  const qualityConfig = {
    excellent: { color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Excellent' },
    good: { color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Good' },
    poor: { color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Poor' },
    disconnected: { color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Disconnected' }
  };
  
  const config = qualityConfig[quality];
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bg}`}>
      <div className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`} />
      <span className={`text-sm font-medium ${config.color}`}>
        {config.label}
        {latency > 0 && quality !== 'disconnected' && (
          <span className="ml-1 text-xs opacity-75">({latency}ms)</span>
        )}
      </span>
    </div>
  );
});

ConnectionQualityIndicator.displayName = 'ConnectionQualityIndicator';

export default function OptimizedDashboard() {
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Use enhanced WebSocket with Redis pub/sub
  const {
    accountData,
    marketData,
    positions,
    orders,
    isConnected,
    error,
    connectionQuality,
    latency,
    reconnect
  } = useEnhancedWebSocket(CONFIG.WEBSOCKET.URL);
  
  // Memoized calculations
  const accountMetrics = useMemo(() => {
    if (!accountData) return null;
    
    const marginLevel = accountData.margin_level;
    const profitTrend: 'up' | 'down' | 'stable' = accountData.profit > 0 ? 'up' : accountData.profit < 0 ? 'down' : 'stable';
    const marginStatus: 'success' | 'warning' | 'error' | 'neutral' = marginLevel > 200 ? 'success' : marginLevel > 100 ? 'warning' : 'error';
    const profitStatus: 'success' | 'warning' | 'error' | 'neutral' = profitTrend === 'up' ? 'success' : profitTrend === 'down' ? 'error' : 'neutral';
    
    return {
      balance: {
        value: accountData.balance.toFixed(2),
        currency: accountData.currency,
        trend: 'stable' as const
      },
      equity: {
        value: accountData.equity.toFixed(2),
        currency: accountData.currency,
        trend: profitTrend
      },
      profit: {
        value: accountData.profit.toFixed(2),
        currency: accountData.currency,
        trend: profitTrend,
        status: profitStatus
      },
      marginLevel: {
        value: marginLevel.toFixed(1),
        status: marginStatus,
        trend: 'stable' as const
      },
      freeMargin: {
        value: accountData.margin_free.toFixed(2),
        currency: accountData.currency
      }
    };
  }, [accountData]);
  
  const positionSummary = useMemo(() => {
    if (!positions) return { total: 0, profitable: 0, losing: 0, totalProfit: 0 };
    
    return positions.reduce((acc, position) => {
      acc.total += 1;
      acc.totalProfit += position.profit;
      if (position.profit > 0) acc.profitable += 1;
      if (position.profit < 0) acc.losing += 1;
      return acc;
    }, { total: 0, profitable: 0, losing: 0, totalProfit: 0 });
  }, [positions]);
  
  const handleReconnect = useCallback(() => {
    reconnect();
  }, [reconnect]);
  
  if (!accountData && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Connecting to real-time data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                MT5 Trading Dashboard
              </h1>
              <ConnectionQualityIndicator quality={connectionQuality} latency={latency} />
            </div>
            
            <div className="flex items-center gap-4">
              {error && (
                <button
                  onClick={handleReconnect}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Reconnect
                </button>
              )}
              
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                {isMinimized ? '↗' : '↙'}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      {!isMinimized && (
        <main className="max-w-7xl mx-auto px-6 py-6">
          {accountMetrics && (
            <>
              {/* Account Overview */}
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Account Overview
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <MetricCard
                    title="Balance"
                    value={`${accountMetrics.balance.value} ${accountMetrics.balance.currency}`}
                    trend={accountMetrics.balance.trend}
                  />
                  <MetricCard
                    title="Equity"
                    value={`${accountMetrics.equity.value} ${accountMetrics.equity.currency}`}
                    trend={accountMetrics.equity.trend}
                  />
                  <MetricCard
                    title="Profit/Loss"
                    value={`${accountMetrics.profit.value} ${accountMetrics.profit.currency}`}
                    trend={accountMetrics.profit.trend}
                    status={accountMetrics.profit.status}
                  />
                  <MetricCard
                    title="Margin Level"
                    value={`${accountMetrics.marginLevel.value}%`}
                    status={accountMetrics.marginLevel.status}
                    subtitle="Risk indicator"
                  />
                  <MetricCard
                    title="Free Margin"
                    value={`${accountMetrics.freeMargin.value} ${accountMetrics.freeMargin.currency}`}
                    subtitle="Available for trading"
                  />
                </div>
              </section>
              
              {/* Positions Summary */}
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Positions Summary
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Total Positions"
                    value={positionSummary.total}
                  />
                  <MetricCard
                    title="Profitable"
                    value={positionSummary.profitable}
                    status="success"
                  />
                  <MetricCard
                    title="Losing"
                    value={positionSummary.losing}
                    status="error"
                  />
                  <MetricCard
                    title="Total P&L"
                    value={`${positionSummary.totalProfit.toFixed(2)} ${accountData?.currency || 'USD'}`}
                    trend={positionSummary.totalProfit > 0 ? 'up' : positionSummary.totalProfit < 0 ? 'down' : 'stable'}
                  />
                </div>
              </section>
              
              {/* Connection Status */}
              <section>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  System Status
                </h2>
                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-200/50 dark:border-slate-700/50">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <StatusIndicator
                        status={isConnected ? 'success' : 'error'}
                        label={`WebSocket ${isConnected ? 'Connected' : 'Disconnected'}`}
                      />
                    </div>
                    <div>
                      <StatusIndicator
                        status={accountData ? 'success' : 'error'}
                        label={`MT5 ${accountData ? 'Online' : 'Offline'}`}
                      />
                    </div>
                    <div>
                      <StatusIndicator
                        status="success"
                        label="Real-time Data Active"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Last update: {formatDateTime()}
                    </p>
                    {latency > 0 && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Connection latency: {latency}ms
                      </p>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      )}
    </div>
  );
}
