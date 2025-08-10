'use client';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { mt5Api } from '@/services/api';
import { Deal, MarketData, Order, Position } from '@/types/mt5';
import React, { useEffect, useState } from 'react';

interface TradingDashboardProps {
  className?: string;
}

export const TradingDashboard: React.FC<TradingDashboardProps> = ({ className }) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [recentDeals, setRecentDeals] = useState<Deal[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const watchedSymbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD'];

  useEffect(() => {
    loadTradingData();
    const interval = setInterval(loadTradingData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadTradingData = async () => {
    try {
      setLoading(true);
      const [positionsData, ordersData, historyData, marketDataResponse] = await Promise.all([
        mt5Api.getPositions(),
        mt5Api.getOrders(),
        mt5Api.getTradeHistory(),
        mt5Api.getMarketData(watchedSymbols)
      ]);

      setPositions(positionsData);
      setOrders(ordersData);
      setRecentDeals(historyData.slice(0, 10)); // Show last 10 deals
      setMarketData(marketDataResponse);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trading data');
    } finally {
      setLoading(false);
    }
  };

  const handleClosePosition = async (positionTicket: number) => {
    try {
      await mt5Api.closePosition(positionTicket);
      await loadTradingData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close position');
    }
  };

  const handleCancelOrder = async (orderTicket: number) => {
    try {
      await mt5Api.cancelOrder(orderTicket);
      await loadTradingData(); // Refresh data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
    }
  };

  const formatCurrency = (value: number, digits: number = 2) => {
    return value.toFixed(digits);
  };

  const getOrderTypeText = (type: number) => {
    const types: Record<number, string> = {
      0: 'Buy',
      1: 'Sell',
      2: 'Buy Limit',
      3: 'Sell Limit',
      4: 'Buy Stop',
      5: 'Sell Stop'
    };
    return types[type] || `Type ${type}`;
  };

  const getPositionTypeText = (type: number) => {
    return type === 0 ? 'Buy' : 'Sell';
  };

  if (loading && positions.length === 0) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Trading Dashboard</h1>
        <Button onClick={loadTradingData} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Market Data */}
      <Card>
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Market Watch</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {marketData.map((data) => (
              <div key={data.symbol} className="bg-gray-50 p-3 rounded">
                <div className="font-medium text-sm">{data.symbol}</div>
                <div className="text-xs text-gray-600">
                  Bid: {formatCurrency(data.bid, 5)}
                </div>
                <div className="text-xs text-gray-600">
                  Ask: {formatCurrency(data.ask, 5)}
                </div>
                <div className="text-xs text-gray-600">
                  Spread: {formatCurrency(data.spread * 100000, 1)} pips
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Open Positions */}
      <Card>
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">
            Open Positions ({positions.length})
          </h2>
          {positions.length === 0 ? (
            <p className="text-gray-500">No open positions</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Symbol</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Volume</th>
                    <th className="text-left py-2">Open Price</th>
                    <th className="text-left py-2">Current Price</th>
                    <th className="text-left py-2">Profit</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position) => (
                    <tr key={position.ticket} className="border-b">
                      <td className="py-2">{position.symbol}</td>
                      <td className="py-2">{getPositionTypeText(position.type)}</td>
                      <td className="py-2">{formatCurrency(position.volume)}</td>
                      <td className="py-2">{formatCurrency(position.price_open, 5)}</td>
                      <td className="py-2">{formatCurrency(position.price_current, 5)}</td>
                      <td className={`py-2 ${position.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${formatCurrency(position.profit)}
                      </td>
                      <td className="py-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleClosePosition(position.ticket)}
                        >
                          Close
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Pending Orders */}
      <Card>
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">
            Pending Orders ({orders.length})
          </h2>
          {orders.length === 0 ? (
            <p className="text-gray-500">No pending orders</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Symbol</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Volume</th>
                    <th className="text-left py-2">Order Price</th>
                    <th className="text-left py-2">SL</th>
                    <th className="text-left py-2">TP</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.ticket} className="border-b">
                      <td className="py-2">{order.symbol}</td>
                      <td className="py-2">{getOrderTypeText(order.type)}</td>
                      <td className="py-2">{formatCurrency(order.volume_current)}</td>
                      <td className="py-2">{formatCurrency(order.price_open, 5)}</td>
                      <td className="py-2">{order.sl > 0 ? formatCurrency(order.sl, 5) : '-'}</td>
                      <td className="py-2">{order.tp > 0 ? formatCurrency(order.tp, 5) : '-'}</td>
                      <td className="py-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelOrder(order.ticket)}
                        >
                          Cancel
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Recent Trades */}
      <Card>
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Recent Trades</h2>
          {recentDeals.length === 0 ? (
            <p className="text-gray-500">No recent trades</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Time</th>
                    <th className="text-left py-2">Symbol</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Volume</th>
                    <th className="text-left py-2">Price</th>
                    <th className="text-left py-2">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDeals.map((deal) => (
                    <tr key={deal.ticket} className="border-b">
                      <td className="py-2">
                        {new Date(deal.time).toLocaleString()}
                      </td>
                      <td className="py-2">{deal.symbol}</td>
                      <td className="py-2">{deal.type === 0 ? 'Buy' : 'Sell'}</td>
                      <td className="py-2">{formatCurrency(deal.volume)}</td>
                      <td className="py-2">{formatCurrency(deal.price, 5)}</td>
                      <td className={`py-2 ${deal.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${formatCurrency(deal.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
