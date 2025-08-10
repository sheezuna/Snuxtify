'use client';

import { AccountInfo } from '@/types/mt5';
import { formatDateTime } from '@/utils/dateUtils';
import { useEffect, useState } from 'react';
import Card from './ui/Card';
import Icon from './ui/Icon';
import MetricCard from './ui/MetricCard';
import StatusIndicator from './ui/StatusIndicator';

interface AccountCardProps {
  accountData: AccountInfo | null;
  isConnected: boolean;
  lastUpdate?: string;
}

// Enhanced Helper Components
interface DetailRowProps {
  icon: string;
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

function DetailRow({ icon, label, value, trend, trendValue }: DetailRowProps) {
  return (
    <div className="group flex items-center justify-between py-3 px-4 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-200 border border-transparent hover:border-gray-200/50 dark:hover:border-gray-600/50">
      <div className="flex items-center text-gray-600 dark:text-gray-400">
        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
          <Icon name={icon as any} size="xs" className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
        {trend && trendValue && (
          <div className={`text-xs mt-0.5 flex items-center justify-end ${
            trend === 'up' ? 'text-green-600 dark:text-green-400' :
            trend === 'down' ? 'text-red-600 dark:text-red-400' :
            'text-gray-500 dark:text-gray-400'
          }`}>
            <Icon 
              name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'activity'} 
              size="xs" 
              className="mr-1" 
            />
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
}

interface PermissionRowProps {
  icon: string;
  label: string;
  enabled: boolean;
  description?: string;
}

function PermissionRow({ icon, label, enabled, description }: PermissionRowProps) {
  return (
    <div className="group flex items-center justify-between py-3 px-4 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-200 border border-transparent hover:border-gray-200/50 dark:hover:border-gray-600/50">
      <div className="flex items-center text-gray-600 dark:text-gray-400">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-colors ${
          enabled 
            ? 'bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-900/50' 
            : 'bg-red-100 dark:bg-red-900/30 group-hover:bg-red-200 dark:group-hover:bg-red-900/50'
        }`}>
          <Icon 
            name={icon as any} 
            size="xs" 
            className={`transition-colors ${
              enabled 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`} 
          />
        </div>
        <div>
          <span className="text-sm font-medium">{label}</span>
          {description && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</div>
          )}
        </div>
      </div>
      <StatusIndicator
        status={enabled ? 'success' : 'error'}
        label={enabled ? 'Enabled' : 'Disabled'}
        size="sm"
        showIcon={false}
      />
    </div>
  );
}

// Performance Chart Component
function PerformanceChart({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className="h-24 flex items-end space-x-0.5">
      {data.map((value, index) => {
        const height = ((value - min) / range) * 100;
        return (
          <div
            key={index}
            className="flex-1 bg-gradient-to-t from-blue-500 to-indigo-500 rounded-sm opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ height: `${Math.max(height, 5)}%` }}
            title={`${value.toFixed(2)}`}
          />
        );
      })}
    </div>
  );
}

// Main Component
export default function AccountCard({ accountData, isConnected, lastUpdate }: AccountCardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'permissions' | 'performance'>('overview');
  const [performanceData, setPerformanceData] = useState<number[]>([]);
  
  // Initialize performance data on client side only
  useEffect(() => {
    const generatePerformanceData = () => {
      return Array.from({ length: 30 }, (_, i) => {
        const baseValue = accountData?.equity || 10000;
        const variation = (Math.sin(i * 0.3) + (i * 0.1 - 1.5)) * baseValue * 0.05; // Remove Math.random() for consistency
        return baseValue + variation;
      });
    };
    
    setPerformanceData(generatePerformanceData());
  }, [accountData?.equity]);
  
  // Helper functions
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: accountData?.currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const formatAccountDateTime = (dateString: string) => {
    try {
      return formatDateTime(dateString);
    } catch {
      return dateString;
    }
  };

  const getMarginLevelStatus = (level: number) => {
    if (level > 200) return { status: 'success' as const, label: 'Healthy', color: 'green' };
    if (level > 100) return { status: 'warning' as const, label: 'Caution', color: 'yellow' };
    return { status: 'error' as const, label: 'Critical', color: 'red' };
  };

  const getProfitTrend = (profit: number) => {
    if (profit > 0) return { direction: 'up' as const, value: `+${formatCurrency(profit)}` };
    if (profit < 0) return { direction: 'down' as const, value: formatCurrency(profit) };
    return { direction: 'neutral' as const, value: formatCurrency(profit) };
  };

  const calculateDrawdown = () => {
    if (!accountData) return 0;
    const equity = accountData.equity;
    const balance = accountData.balance;
    return ((balance - equity) / balance) * 100;
  };

  const generateMockPerformanceData = () => {
    // This function is no longer used - performance data is now generated in useEffect
    return [];
  };

  // Loading/Disconnected state
  if (!accountData) {
    return (
      <Card
        title="Account Dashboard"
        subtitle="Connecting to trading account..."
        icon="account"
        loading={isConnected}
        headerAction={
          <StatusIndicator
            status={isConnected ? 'loading' : 'error'}
            label={isConnected ? 'Connecting...' : 'Connection Failed'}
          />
        }
      >
        {!isConnected && (
          <div className="text-center py-16 lg:py-20">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl animate-pulse"></div>
              <div className="absolute inset-2 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center">
                <Icon name="disconnect" size="lg" className="text-gray-400" />
              </div>
            </div>
            <div className="text-gray-500 dark:text-gray-400 text-xl font-semibold mb-3">
              No MT5 Connection
            </div>
            <div className="text-gray-400 dark:text-gray-500 text-sm max-w-md mx-auto">
              Unable to connect to MetaTrader 5. Please check your connection settings and try again.
            </div>
          </div>
        )}
      </Card>
    );
  }

  const marginStatus = getMarginLevelStatus(accountData.margin_level);
  const profitTrend = getProfitTrend(accountData.profit);
  const drawdown = calculateDrawdown();
  // performanceData is now managed as state and initialized in useEffect

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: 'dashboard' },
    { id: 'details' as const, label: 'Details', icon: 'user' },
    { id: 'permissions' as const, label: 'Permissions', icon: 'shield' },
    { id: 'performance' as const, label: 'Performance', icon: 'chart' },
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Main Account Card */}
      <Card
        title="Trading Account Dashboard"
        subtitle={`Account #${accountData.login} • ${accountData.server} • ${accountData.currency}`}
        icon="account"
        headerAction={
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <Icon name="clock" size="xs" />
              <span>Updated: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'}</span>
            </div>
            <StatusIndicator
              status={isConnected ? 'success' : 'error'}
              label={isConnected ? 'Live' : 'Offline'}
              size="sm"
              animated={isConnected}
            />
          </div>
        }
      >
        {/* Enhanced Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <MetricCard
            title="Account Balance"
            value={formatCurrency(accountData.balance)}
            icon="wallet"
            color="blue"
            size="sm"
            subtitle="Available funds"
          />
          <MetricCard
            title="Current Equity"
            value={formatCurrency(accountData.equity)}
            icon="trending-up"
            color="green"
            size="sm"
            subtitle="Real-time value"
          />
          <MetricCard
            title="Floating P&L"
            value={profitTrend.value}
            icon={accountData.profit >= 0 ? 'trending-up' : 'trending-down'}
            color={accountData.profit >= 0 ? 'green' : 'red'}
            trend={profitTrend}
            size="sm"
            subtitle="Unrealized profit/loss"
          />
          <MetricCard
            title="Margin Level"
            value={`${formatNumber(accountData.margin_level, 0)}%`}
            icon="shield"
            color={marginStatus.color as any}
            subtitle={marginStatus.label}
            size="sm"
          />
        </div>

        {/* Advanced Risk Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 lg:p-6 border border-purple-200/50 dark:border-purple-700/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300">Drawdown</h3>
              <Icon name="trending-down" size="sm" className="text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-200">
              {drawdown.toFixed(2)}%
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              Current equity drawdown
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl p-4 lg:p-6 border border-orange-200/50 dark:border-orange-700/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-300">Free Margin</h3>
              <Icon name="calculator" size="sm" className="text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-200">
              {formatCurrency(accountData.margin_free)}
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              Available for trading
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl p-4 lg:p-6 border border-cyan-200/50 dark:border-cyan-700/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-cyan-800 dark:text-cyan-300">Leverage</h3>
              <Icon name="leverage" size="sm" className="text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-cyan-900 dark:text-cyan-200">
              1:{accountData.leverage}
            </div>
            <div className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">
              Maximum leverage ratio
            </div>
          </div>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl p-2 mb-6 border border-gray-200/50 dark:border-gray-600/30">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 shadow-md text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-700/50'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Icon name={tab.icon as any} size="xs" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/80 dark:to-gray-700/80 rounded-xl p-6 border border-gray-200/50 dark:border-gray-600/30">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                    <Icon name="chart" size="sm" className="mr-2" />
                    Performance Chart
                  </h3>
                  <PerformanceChart data={performanceData} />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                    <span>30 days ago</span>
                    <span>Today</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/80 dark:to-gray-700/80 rounded-xl p-6 border border-gray-200/50 dark:border-gray-600/30">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                    <Icon name="activity" size="sm" className="mr-2" />
                    Quick Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Account Age</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-white">125 days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Trades</span>
                      <span className="text-sm font-medium text-gray-800 dark:text-white">1,247</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Win Rate</span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">73.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Max Drawdown</span>
                      <span className="text-sm font-medium text-red-600 dark:text-red-400">-12.3%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="animate-fade-in">
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/80 dark:to-gray-700/80 rounded-xl p-6 border border-gray-200/50 dark:border-gray-600/30">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
                  <Icon name="user" size="sm" className="mr-2" />
                  Account Information
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Basic Information</h4>
                    <DetailRow icon="credit-card" label="Login" value={accountData.login.toString()} />
                    <DetailRow icon="user" label="Name" value={accountData.name} />
                    <DetailRow icon="server" label="Server" value={accountData.server} />
                    <DetailRow icon="currency" label="Currency" value={accountData.currency} />
                    <DetailRow icon="bank" label="Company" value="MetaQuotes Software Corp." />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Financial Details</h4>
                    <DetailRow icon="wallet" label="Balance" value={formatCurrency(accountData.balance)} />
                    <DetailRow icon="calculator" label="Credit" value={formatCurrency(accountData.credit)} />
                    <DetailRow icon="margin" label="Margin" value={formatCurrency(accountData.margin)} />
                    <DetailRow icon="leverage" label="Leverage" value={`1:${accountData.leverage}`} />
                    <DetailRow icon="percent" label="Margin Level" value={`${formatNumber(accountData.margin_level, 0)}%`} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="animate-fade-in">
              <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/80 dark:to-gray-700/80 rounded-xl p-6 border border-gray-200/50 dark:border-gray-600/30">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
                  <Icon name="shield" size="sm" className="mr-2" />
                  Trading Permissions & Access Rights
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Trading Rights</h4>
                    <PermissionRow 
                      icon="trade" 
                      label="Manual Trading" 
                      enabled={accountData.trade_allowed}
                      description="Place manual trades and orders"
                    />
                    <PermissionRow 
                      icon="expert" 
                      label="Expert Advisors" 
                      enabled={accountData.trade_expert}
                      description="Run automated trading systems"
                    />
                    <PermissionRow 
                      icon="activity" 
                      label="Live Trading" 
                      enabled={accountData.trade_allowed}
                      description="Execute trades in live market"
                    />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">System Access</h4>
                    <PermissionRow 
                      icon="settings" 
                      label="API Access" 
                      enabled={true}
                      description="Connect via MetaTrader API"
                    />
                    <PermissionRow 
                      icon="monitor" 
                      label="Real-time Data" 
                      enabled={isConnected}
                      description="Receive live market data"
                    />
                    <PermissionRow 
                      icon="shield" 
                      label="Security Enhanced" 
                      enabled={true}
                      description="Advanced security protocols"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/80 dark:to-gray-700/80 rounded-xl p-6 border border-gray-200/50 dark:border-gray-600/30">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                    <Icon name="chart" size="sm" className="mr-2" />
                    Equity Curve
                  </h3>
                  <div className="h-48">
                    <PerformanceChart data={performanceData} />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/80 dark:to-gray-700/80 rounded-xl p-6 border border-gray-200/50 dark:border-gray-600/30">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                    <Icon name="trending-up" size="sm" className="mr-2" />
                    Performance Metrics
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200/50 dark:border-gray-600/50">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Return</span>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">+23.47%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200/50 dark:border-gray-600/50">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Return</span>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">+2.13%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200/50 dark:border-gray-600/50">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Sharpe Ratio</span>
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">1.67</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200/50 dark:border-gray-600/50">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Max Drawdown</span>
                      <span className="text-sm font-semibold text-red-600 dark:text-red-400">-12.3%</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Calmar Ratio</span>
                      <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">1.91</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Connection Status Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
          <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 dark:from-emerald-900/20 dark:via-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-emerald-200/50 dark:border-emerald-700/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center">
                <div className="relative mr-4">
                  <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
                  <div className="absolute inset-0 w-4 h-4 bg-emerald-400 rounded-full animate-ping opacity-30" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                    Live Connection Active
                  </span>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                    Real-time data streaming • Ultra-low latency
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 text-xs text-emerald-600 dark:text-emerald-400">
                <div className="flex items-center">
                  <Icon name="zap" size="xs" className="mr-1" />
                  <span>&lt;1ms</span>
                </div>
                <div className="flex items-center">
                  <Icon name="shield" size="xs" className="mr-1" />
                  <span>Encrypted</span>
                </div>
                <div className="flex items-center">
                  <Icon name="activity" size="xs" className="mr-1" />
                  <span>99.9% Uptime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
