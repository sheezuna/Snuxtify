'use client';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { mt5Api } from '@/services/api';
import { MarketData, SymbolInfo } from '@/types/mt5';
import React, { useEffect, useState } from 'react';

interface MarketWatchProps {
  className?: string;
}

export const MarketWatch: React.FC<MarketWatchProps> = ({ className }) => {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [watchedSymbols, setWatchedSymbols] = useState<string[]>(['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD']);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [symbolInfo, setSymbolInfo] = useState<Record<string, SymbolInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');

  useEffect(() => {
    loadSymbols();
  }, []);

  useEffect(() => {
    if (watchedSymbols.length > 0) {
      loadMarketData();
      const interval = setInterval(loadMarketData, 1000); // Update every second
      return () => clearInterval(interval);
    }
  }, [watchedSymbols]);

  const loadSymbols = async () => {
    try {
      const symbolsData = await mt5Api.getSymbols();
      setSymbols(symbolsData);
    } catch (err) {
      setError('Failed to load symbols');
    }
  };

  const loadMarketData = async () => {
    try {
      const [marketDataResponse, ...symbolInfoResponses] = await Promise.all([
        mt5Api.getMarketData(watchedSymbols),
        ...watchedSymbols.map(symbol => mt5Api.getSymbolInfo(symbol).catch(() => null))
      ]);

      setMarketData(marketDataResponse);
      
      // Update symbol info
      const newSymbolInfo: Record<string, SymbolInfo> = {};
      symbolInfoResponses.forEach((info, index) => {
        if (info) {
          newSymbolInfo[watchedSymbols[index]] = info;
        }
      });
      setSymbolInfo(prev => ({ ...prev, ...newSymbolInfo }));
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  const addSymbol = () => {
    if (selectedSymbol && !watchedSymbols.includes(selectedSymbol)) {
      setWatchedSymbols(prev => [...prev, selectedSymbol]);
      setSelectedSymbol('');
    }
  };

  const removeSymbol = (symbol: string) => {
    setWatchedSymbols(prev => prev.filter(s => s !== symbol));
  };

  const formatPrice = (price: number, digits: number = 5) => {
    return price.toFixed(digits);
  };

  const calculateSpreadPips = (spread: number, symbol: string) => {
    const info = symbolInfo[symbol];
    if (!info) return spread.toFixed(1);
    
    // For JPY pairs, pip value is different
    const isJpyPair = symbol.includes('JPY');
    const pipMultiplier = isJpyPair ? 100 : 100000;
    
    return (spread * pipMultiplier).toFixed(1);
  };

  const getPriceChangeColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-900';
  };

  if (loading && marketData.length === 0) {
    return (
      <Card className={className}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Market Watch</h2>
          <div className="flex items-center space-x-2">
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="p-2 border border-gray-300 rounded text-sm"
            >
              <option value="">Add Symbol</option>
              {symbols
                .filter(symbol => !watchedSymbols.includes(symbol))
                .map((symbol) => (
                  <option key={symbol} value={symbol}>
                    {symbol}
                  </option>
                ))}
            </select>
            <Button size="sm" onClick={addSymbol} disabled={!selectedSymbol}>
              Add
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {marketData.map((data) => {
            const info = symbolInfo[data.symbol];
            const digits = info?.digits || 5;
            
            return (
              <div
                key={data.symbol}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm">{data.symbol}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(data.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Bid</div>
                    <div className={`font-mono text-sm font-medium`}>
                      {formatPrice(data.bid, digits)}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Ask</div>
                    <div className={`font-mono text-sm font-medium`}>
                      {formatPrice(data.ask, digits)}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Spread</div>
                    <div className="font-mono text-sm">
                      {calculateSpreadPips(data.spread, data.symbol)}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-1">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs"
                      onClick={() => {/* TODO: Quick buy */}}
                    >
                      BUY
                    </Button>
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs"
                      onClick={() => {/* TODO: Quick sell */}}
                    >
                      SELL
                    </Button>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeSymbol(data.symbol)}
                    className="text-red-600 hover:text-red-700 px-2 py-1"
                  >
                    ×
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {watchedSymbols.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No symbols in watch list. Add symbols to monitor their prices.
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 text-center">
          Updates every second • {marketData.length} symbols watched
        </div>
      </div>
    </Card>
  );
};
