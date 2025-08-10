'use client';

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { MarketWatch } from '@/components/MarketWatch';
import { OrderForm } from '@/components/OrderForm';
import { TradingDashboard } from '@/components/TradingDashboard';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useState } from 'react';

export default function TradingPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'order' | 'market'>('dashboard');
  
  // WebSocket connection for real-time updates
  const { isConnected: isWebSocketConnected, error: websocketError, reconnect } = useWebSocket(
    process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws'
  );

  const tabs = [
    { id: 'dashboard', label: 'Trading Dashboard', icon: '📊' },
    { id: 'order', label: 'Place Order', icon: '📝' },
    { id: 'market', label: 'Market Watch', icon: '📈' }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-blue-950 dark:to-indigo-950 transition-all duration-1000"></div>
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-float opacity-70"></div>
          <div className="absolute top-3/4 left-3/4 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full mix-blend-multiply filter blur-3xl animate-float animation-delay-2000 opacity-70"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-6 max-w-screen-2xl">
          
          {/* Header */}
          <Header isWebSocketConnected={isWebSocketConnected} />

          {/* Connection Status */}
          {websocketError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span>WebSocket connection error: {websocketError}</span>
                <button
                  onClick={reconnect}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Reconnect
                </button>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="mb-6">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-2">
              <div className="flex space-x-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-lg transform scale-[0.98]'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="transition-all duration-300">
            {activeTab === 'dashboard' && (
              <TradingDashboard className="animate-fadeIn" />
            )}
            
            {activeTab === 'order' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                <div className="lg:col-span-2">
                  <OrderForm />
                </div>
                <div className="lg:col-span-1">
                  <MarketWatch />
                </div>
              </div>
            )}
            
            {activeTab === 'market' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
                <MarketWatch />
                <div className="space-y-6">
                  {/* Quick Trading Panel */}
                  <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Quick Trade</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Use the Market Watch panel to monitor real-time prices and access quick trading buttons.
                      For detailed order placement, switch to the &quot;Place Order&quot; tab.
                    </p>
                  </div>
                  
                  {/* Market Summary */}
                  <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Market Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">24</div>
                        <div className="text-sm text-gray-600">Active Symbols</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">Live</div>
                        <div className="text-sm text-gray-600">Market Status</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">1s</div>
                        <div className="text-sm text-gray-600">Update Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">0.1</div>
                        <div className="text-sm text-gray-600">Min Volume</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Trading Features Overview */}
          <div className="mt-12 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Available Trading Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Account Information */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl">
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Account Information</h3>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                  <li>• Real-time balance & equity</li>
                  <li>• Margin & free margin</li>
                  <li>• Account leverage & status</li>
                  <li>• Currency & broker details</li>
                </ul>
              </div>

              {/* Market Data */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl">
                <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2">Market Data</h3>
                <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                  <li>• Live bid/ask prices</li>
                  <li>• Real-time spreads</li>
                  <li>• Tick data with volume</li>
                  <li>• OHLC candlestick data</li>
                </ul>
              </div>

              {/* Trading Operations */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl">
                <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Trading Operations</h3>
                <ul className="text-sm text-purple-700 dark:text-purple-400 space-y-1">
                  <li>• Market orders (buy/sell)</li>
                  <li>• Pending orders (limit/stop)</li>
                  <li>• Order modification</li>
                  <li>• Position management</li>
                </ul>
              </div>

              {/* Order Management */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-xl">
                <h3 className="font-semibold text-orange-800 dark:text-orange-300 mb-2">Order & Position Management</h3>
                <ul className="text-sm text-orange-700 dark:text-orange-400 space-y-1">
                  <li>• Open positions tracking</li>
                  <li>• Pending orders status</li>
                  <li>• Trade history & P&L</li>
                  <li>• Order execution status</li>
                </ul>
              </div>

              {/* Error Handling */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-xl">
                <h3 className="font-semibold text-red-800 dark:text-red-300 mb-2">Error & Event Handling</h3>
                <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
                  <li>• Trade result codes</li>
                  <li>• Real-time order updates</li>
                  <li>• Connection monitoring</li>
                  <li>• Error notifications</li>
                </ul>
              </div>

              {/* Utilities */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/20 dark:to-gray-600/20 p-4 rounded-xl">
                <h3 className="font-semibold text-gray-800 dark:text-gray-300 mb-2">Trading Utilities</h3>
                <ul className="text-sm text-gray-700 dark:text-gray-400 space-y-1">
                  <li>• Margin calculation</li>
                  <li>• Profit/loss calculation</li>
                  <li>• Symbol information</li>
                  <li>• Market analysis tools</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
