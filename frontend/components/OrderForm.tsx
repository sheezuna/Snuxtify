'use client';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { mt5Api } from '@/services/api';
import { OrderResult, OrderType, SymbolInfo } from '@/types/mt5';
import React, { useEffect, useState } from 'react';

interface OrderFormProps {
  className?: string;
}

export const OrderForm: React.FC<OrderFormProps> = ({ className }) => {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [symbolInfo, setSymbolInfo] = useState<SymbolInfo | null>(null);
  const [orderData, setOrderData] = useState({
    volume: 0.1,
    orderType: OrderType.BUY,
    price: 0,
    sl: 0,
    tp: 0,
    comment: ''
  });
  const [isMarketOrder, setIsMarketOrder] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrderResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSymbols();
  }, []);

  useEffect(() => {
    if (selectedSymbol) {
      loadSymbolInfo();
    }
  }, [selectedSymbol]);

  const loadSymbols = async () => {
    try {
      const symbolsData = await mt5Api.getSymbols();
      setSymbols(symbolsData);
      if (symbolsData.length > 0 && !selectedSymbol) {
        setSelectedSymbol(symbolsData[0]);
      }
    } catch (err) {
      setError('Failed to load symbols');
    }
  };

  const loadSymbolInfo = async () => {
    try {
      const info = await mt5Api.getSymbolInfo(selectedSymbol);
      setSymbolInfo(info);
      if (isMarketOrder) {
        setOrderData(prev => ({
          ...prev,
          price: orderData.orderType === OrderType.BUY ? info.ask : info.bid
        }));
      }
    } catch (err) {
      setError('Failed to load symbol info');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      let orderResult: OrderResult;

      if (isMarketOrder) {
        orderResult = await mt5Api.placeMarketOrder(
          selectedSymbol,
          orderData.volume,
          orderData.orderType,
          orderData.sl,
          orderData.tp,
          orderData.comment
        );
      } else {
        orderResult = await mt5Api.placePendingOrder(
          selectedSymbol,
          orderData.volume,
          orderData.orderType,
          orderData.price,
          orderData.sl,
          orderData.tp,
          orderData.comment
        );
      }

      setResult(orderResult);
      if (orderResult.retcode === 10009) { // TRADE_RETCODE_DONE
        // Reset form on success
        setOrderData(prev => ({ ...prev, sl: 0, tp: 0, comment: '' }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const getOrderTypeText = (type: OrderType) => {
    const types: Record<OrderType, string> = {
      [OrderType.BUY]: 'Buy',
      [OrderType.SELL]: 'Sell',
      [OrderType.BUY_LIMIT]: 'Buy Limit',
      [OrderType.SELL_LIMIT]: 'Sell Limit',
      [OrderType.BUY_STOP]: 'Buy Stop',
      [OrderType.SELL_STOP]: 'Sell Stop',
      [OrderType.BUY_STOP_LIMIT]: 'Buy Stop Limit',
      [OrderType.SELL_STOP_LIMIT]: 'Sell Stop Limit',
      [OrderType.CLOSE_BY]: 'Close By'
    };
    return types[type] || `Type ${type}`;
  };

  const getResultColor = (retcode: number) => {
    return retcode === 10009 ? 'text-green-600' : 'text-red-600';
  };

  const getResultMessage = (retcode: number) => {
    const messages: Record<number, string> = {
      10009: 'Order executed successfully',
      10004: 'Requote',
      10006: 'Request rejected',
      10007: 'Request canceled by trader',
      10008: 'Order placed',
      10013: 'Invalid request',
      10014: 'Invalid volume',
      10015: 'Invalid price',
      10016: 'Invalid stops',
      10018: 'Market is closed',
      10019: 'There is not enough money to complete the request',
      10020: 'Prices changed',
      10021: 'There are not enough quotes to complete the request'
    };
    return messages[retcode] || `Error code: ${retcode}`;
  };

  return (
    <Card className={className}>
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Place Order</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Order Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Mode
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={isMarketOrder}
                  onChange={() => setIsMarketOrder(true)}
                  className="mr-2"
                />
                Market Order
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!isMarketOrder}
                  onChange={() => setIsMarketOrder(false)}
                  className="mr-2"
                />
                Pending Order
              </label>
            </div>
          </div>

          {/* Symbol Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Symbol
            </label>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Select Symbol</option>
              {symbols.map((symbol) => (
                <option key={symbol} value={symbol}>
                  {symbol}
                </option>
              ))}
            </select>
          </div>

          {/* Symbol Info Display */}
          {symbolInfo && (
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Bid: {symbolInfo.bid.toFixed(symbolInfo.digits)}</div>
                <div>Ask: {symbolInfo.ask.toFixed(symbolInfo.digits)}</div>
                <div>Spread: {symbolInfo.spread}</div>
                <div>Min Volume: {symbolInfo.volume_min}</div>
              </div>
            </div>
          )}

          {/* Order Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Type
            </label>
            <select
              value={orderData.orderType}
              onChange={(e) => setOrderData(prev => ({ ...prev, orderType: parseInt(e.target.value) as OrderType }))}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              {isMarketOrder ? (
                <>
                  <option value={OrderType.BUY}>Buy</option>
                  <option value={OrderType.SELL}>Sell</option>
                </>
              ) : (
                <>
                  <option value={OrderType.BUY_LIMIT}>Buy Limit</option>
                  <option value={OrderType.SELL_LIMIT}>Sell Limit</option>
                  <option value={OrderType.BUY_STOP}>Buy Stop</option>
                  <option value={OrderType.SELL_STOP}>Sell Stop</option>
                </>
              )}
            </select>
          </div>

          {/* Volume */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Volume
            </label>
            <input
              type="number"
              step="0.01"
              min={symbolInfo?.volume_min || 0.01}
              max={symbolInfo?.volume_max || 100}
              value={orderData.volume}
              onChange={(e) => setOrderData(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          {/* Price (for pending orders) */}
          {!isMarketOrder && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <input
                type="number"
                step={symbolInfo ? Math.pow(10, -symbolInfo.digits).toFixed(symbolInfo.digits) : "0.00001"}
                value={orderData.price}
                onChange={(e) => setOrderData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          )}

          {/* Stop Loss */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stop Loss (Optional)
            </label>
            <input
              type="number"
              step={symbolInfo ? Math.pow(10, -symbolInfo.digits).toFixed(symbolInfo.digits) : "0.00001"}
              value={orderData.sl || ''}
              onChange={(e) => setOrderData(prev => ({ ...prev, sl: parseFloat(e.target.value) || 0 }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Take Profit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Take Profit (Optional)
            </label>
            <input
              type="number"
              step={symbolInfo ? Math.pow(10, -symbolInfo.digits).toFixed(symbolInfo.digits) : "0.00001"}
              value={orderData.tp || ''}
              onChange={(e) => setOrderData(prev => ({ ...prev, tp: parseFloat(e.target.value) || 0 }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comment (Optional)
            </label>
            <input
              type="text"
              maxLength={31}
              value={orderData.comment}
              onChange={(e) => setOrderData(prev => ({ ...prev, comment: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Order comment..."
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || !selectedSymbol}
            className="w-full"
          >
            {loading ? 'Placing Order...' : `Place ${isMarketOrder ? 'Market' : 'Pending'} Order`}
          </Button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Result Message */}
        {result && (
          <div className="mt-4 bg-gray-50 border border-gray-200 px-4 py-3 rounded">
            <div className={`font-medium ${getResultColor(result.retcode)}`}>
              {getResultMessage(result.retcode)}
            </div>
            {result.retcode === 10009 && (
              <div className="mt-2 text-sm text-gray-600">
                <div>Order: #{result.order}</div>
                <div>Deal: #{result.deal}</div>
                <div>Volume: {result.volume}</div>
                <div>Price: {result.price.toFixed(symbolInfo?.digits || 5)}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
