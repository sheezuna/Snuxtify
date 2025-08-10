"""
Comprehensive MT5 Trading Service
Handles all trading operations, market data, and order management
"""

import MetaTrader5 as mt5
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple
import pandas as pd

from models import (
    OrderRequest, OrderResult, Position, Order, Deal, SymbolInfo, 
    TickData, MarketData, CandlestickData, OrderType, OrderState
)
from core.exceptions import MT5ConnectionError, MT5TradingError

logger = logging.getLogger(__name__)


class TradingService:
    """Comprehensive MT5 trading service"""
    
    def __init__(self, mt5_service):
        self.mt5_service = mt5_service
        self._symbols_cache = {}
        self._last_cache_update = None
        self.cache_timeout = 300  # 5 minutes
    
    async def _ensure_connected(self):
        """Ensure MT5 is connected before operations"""
        if not self.mt5_service.is_connected():
            raise MT5ConnectionError("MT5 not connected")
    
    # Market Data Methods
    async def get_symbol_info(self, symbol: str) -> Optional[SymbolInfo]:
        """Get detailed symbol information"""
        await self._ensure_connected()
        
        try:
            symbol_info = mt5.symbol_info(symbol)
            if symbol_info is None:
                logger.warning(f"Symbol {symbol} not found")
                return None
            
            # Get current tick
            tick = mt5.symbol_info_tick(symbol)
            if tick is None:
                logger.warning(f"No tick data for symbol {symbol}")
                return None
            
            return SymbolInfo(
                name=symbol_info.name,
                digits=symbol_info.digits,
                spread=symbol_info.spread,
                volume_min=symbol_info.volume_min,
                volume_max=symbol_info.volume_max,
                volume_step=symbol_info.volume_step,
                contract_size=symbol_info.trade_contract_size,
                margin_initial=symbol_info.margin_initial,
                margin_maintenance=symbol_info.margin_maintenance,
                currency_base=symbol_info.currency_base,
                currency_profit=symbol_info.currency_profit,
                currency_margin=symbol_info.currency_margin,
                time=datetime.fromtimestamp(tick.time),
                bid=tick.bid,
                ask=tick.ask,
                last=tick.last,
                volume=tick.volume
            )
        except Exception as e:
            logger.error(f"Error getting symbol info for {symbol}: {e}")
            raise MT5TradingError(f"Failed to get symbol info: {e}")
    
    async def get_tick_data(self, symbol: str) -> Optional[TickData]:
        """Get latest tick data for symbol"""
        await self._ensure_connected()
        
        try:
            tick = mt5.symbol_info_tick(symbol)
            if tick is None:
                return None
            
            return TickData(
                time=datetime.fromtimestamp(tick.time),
                bid=tick.bid,
                ask=tick.ask,
                last=tick.last,
                volume=tick.volume,
                time_msc=tick.time_msc,
                flags=tick.flags,
                volume_real=tick.volume_real
            )
        except Exception as e:
            logger.error(f"Error getting tick data for {symbol}: {e}")
            raise MT5TradingError(f"Failed to get tick data: {e}")
    
    async def get_market_data(self, symbols: List[str]) -> List[MarketData]:
        """Get market data for multiple symbols"""
        await self._ensure_connected()
        
        market_data = []
        for symbol in symbols:
            try:
                tick = mt5.symbol_info_tick(symbol)
                if tick:
                    market_data.append(MarketData(
                        symbol=symbol,
                        bid=tick.bid,
                        ask=tick.ask,
                        spread=tick.ask - tick.bid,
                        timestamp=datetime.fromtimestamp(tick.time)
                    ))
            except Exception as e:
                logger.warning(f"Failed to get market data for {symbol}: {e}")
        
        return market_data
    
    async def get_candlestick_data(
        self, 
        symbol: str, 
        timeframe: str = "M1", 
        count: int = 100
    ) -> List[CandlestickData]:
        """Get OHLC candlestick data"""
        await self._ensure_connected()
        
        try:
            # Map timeframe string to MT5 constant
            timeframe_map = {
                "M1": mt5.TIMEFRAME_M1,
                "M5": mt5.TIMEFRAME_M5,
                "M15": mt5.TIMEFRAME_M15,
                "M30": mt5.TIMEFRAME_M30,
                "H1": mt5.TIMEFRAME_H1,
                "H4": mt5.TIMEFRAME_H4,
                "D1": mt5.TIMEFRAME_D1,
                "W1": mt5.TIMEFRAME_W1,
                "MN1": mt5.TIMEFRAME_MN1
            }
            
            mt5_timeframe = timeframe_map.get(timeframe, mt5.TIMEFRAME_M1)
            
            rates = mt5.copy_rates_from_pos(symbol, mt5_timeframe, 0, count)
            if rates is None:
                logger.warning(f"No rates data for {symbol}")
                return []
            
            candlesticks = []
            for rate in rates:
                candlesticks.append(CandlestickData(
                    symbol=symbol,
                    timeframe=timeframe,
                    time=datetime.fromtimestamp(rate['time']),
                    open=rate['open'],
                    high=rate['high'],
                    low=rate['low'],
                    close=rate['close'],
                    tick_volume=rate['tick_volume'],
                    spread=rate['spread'],
                    real_volume=rate['real_volume']
                ))
            
            return candlesticks
        except Exception as e:
            logger.error(f"Error getting candlestick data for {symbol}: {e}")
            raise MT5TradingError(f"Failed to get candlestick data: {e}")
    
    # Trading Operations
    async def place_market_order(
        self, 
        symbol: str, 
        volume: float, 
        order_type: OrderType, 
        sl: float = 0.0, 
        tp: float = 0.0, 
        comment: str = ""
    ) -> OrderResult:
        """Place a market order (buy/sell)"""
        await self._ensure_connected()
        
        try:
            # Get current price
            tick = mt5.symbol_info_tick(symbol)
            if tick is None:
                raise MT5TradingError(f"Cannot get price for {symbol}")
            
            price = tick.ask if order_type == OrderType.BUY else tick.bid
            
            request = {
                "action": mt5.TRADE_ACTION_DEAL,
                "symbol": symbol,
                "volume": volume,
                "type": order_type.value,
                "price": price,
                "sl": sl,
                "tp": tp,
                "deviation": 20,
                "magic": 0,
                "comment": comment,
                "type_time": mt5.ORDER_TIME_GTC,
                "type_filling": mt5.ORDER_FILLING_IOC,
            }
            
            result = mt5.order_send(request)
            if result is None:
                raise MT5TradingError("Order send failed - no result")
            
            return OrderResult(
                retcode=result.retcode,
                deal=result.deal,
                order=result.order,
                volume=result.volume,
                price=result.price,
                bid=result.bid,
                ask=result.ask,
                comment=result.comment,
                request_id=result.request_id,
                retcode_external=result.retcode_external
            )
        except Exception as e:
            logger.error(f"Error placing market order: {e}")
            raise MT5TradingError(f"Failed to place market order: {e}")
    
    async def place_pending_order(
        self, 
        symbol: str, 
        volume: float, 
        order_type: OrderType, 
        price: float,
        sl: float = 0.0, 
        tp: float = 0.0, 
        comment: str = ""
    ) -> OrderResult:
        """Place a pending order (limit/stop)"""
        await self._ensure_connected()
        
        try:
            request = {
                "action": mt5.TRADE_ACTION_PENDING,
                "symbol": symbol,
                "volume": volume,
                "type": order_type.value,
                "price": price,
                "sl": sl,
                "tp": tp,
                "deviation": 20,
                "magic": 0,
                "comment": comment,
                "type_time": mt5.ORDER_TIME_GTC,
                "type_filling": mt5.ORDER_FILLING_RETURN,
            }
            
            result = mt5.order_send(request)
            if result is None:
                raise MT5TradingError("Pending order send failed - no result")
            
            return OrderResult(
                retcode=result.retcode,
                deal=result.deal,
                order=result.order,
                volume=result.volume,
                price=result.price,
                bid=result.bid,
                ask=result.ask,
                comment=result.comment,
                request_id=result.request_id,
                retcode_external=result.retcode_external
            )
        except Exception as e:
            logger.error(f"Error placing pending order: {e}")
            raise MT5TradingError(f"Failed to place pending order: {e}")
    
    async def modify_order(
        self, 
        order_ticket: int, 
        price: Optional[float] = None,
        sl: Optional[float] = None, 
        tp: Optional[float] = None
    ) -> OrderResult:
        """Modify an existing order"""
        await self._ensure_connected()
        
        try:
            # Get current order info
            order_info = mt5.orders_get(ticket=order_ticket)
            if not order_info:
                raise MT5TradingError(f"Order {order_ticket} not found")
            
            order = order_info[0]
            
            request = {
                "action": mt5.TRADE_ACTION_MODIFY,
                "order": order_ticket,
                "price": price if price is not None else order.price_open,
                "sl": sl if sl is not None else order.sl,
                "tp": tp if tp is not None else order.tp,
            }
            
            result = mt5.order_send(request)
            if result is None:
                raise MT5TradingError("Order modification failed - no result")
            
            return OrderResult(
                retcode=result.retcode,
                deal=result.deal,
                order=result.order,
                volume=result.volume,
                price=result.price,
                bid=result.bid,
                ask=result.ask,
                comment=result.comment,
                request_id=result.request_id,
                retcode_external=result.retcode_external
            )
        except Exception as e:
            logger.error(f"Error modifying order {order_ticket}: {e}")
            raise MT5TradingError(f"Failed to modify order: {e}")
    
    async def close_position(
        self, 
        position_ticket: int, 
        volume: Optional[float] = None
    ) -> OrderResult:
        """Close a position (fully or partially)"""
        await self._ensure_connected()
        
        try:
            # Get position info
            position_info = mt5.positions_get(ticket=position_ticket)
            if not position_info:
                raise MT5TradingError(f"Position {position_ticket} not found")
            
            position = position_info[0]
            close_volume = volume if volume is not None else position.volume
            
            # Get current price
            tick = mt5.symbol_info_tick(position.symbol)
            if tick is None:
                raise MT5TradingError(f"Cannot get price for {position.symbol}")
            
            # Determine close price and type
            if position.type == 0:  # Buy position
                close_price = tick.bid
                close_type = mt5.ORDER_TYPE_SELL
            else:  # Sell position
                close_price = tick.ask
                close_type = mt5.ORDER_TYPE_BUY
            
            request = {
                "action": mt5.TRADE_ACTION_DEAL,
                "symbol": position.symbol,
                "volume": close_volume,
                "type": close_type,
                "position": position_ticket,
                "price": close_price,
                "deviation": 20,
                "magic": position.magic,
                "comment": f"Close position {position_ticket}",
                "type_time": mt5.ORDER_TIME_GTC,
                "type_filling": mt5.ORDER_FILLING_IOC,
            }
            
            result = mt5.order_send(request)
            if result is None:
                raise MT5TradingError("Position close failed - no result")
            
            return OrderResult(
                retcode=result.retcode,
                deal=result.deal,
                order=result.order,
                volume=result.volume,
                price=result.price,
                bid=result.bid,
                ask=result.ask,
                comment=result.comment,
                request_id=result.request_id,
                retcode_external=result.retcode_external
            )
        except Exception as e:
            logger.error(f"Error closing position {position_ticket}: {e}")
            raise MT5TradingError(f"Failed to close position: {e}")
    
    async def cancel_order(self, order_ticket: int) -> OrderResult:
        """Cancel a pending order"""
        await self._ensure_connected()
        
        try:
            request = {
                "action": mt5.TRADE_ACTION_REMOVE,
                "order": order_ticket,
            }
            
            result = mt5.order_send(request)
            if result is None:
                raise MT5TradingError("Order cancellation failed - no result")
            
            return OrderResult(
                retcode=result.retcode,
                deal=result.deal,
                order=result.order,
                volume=result.volume,
                price=result.price,
                bid=result.bid,
                ask=result.ask,
                comment=result.comment,
                request_id=result.request_id,
                retcode_external=result.retcode_external
            )
        except Exception as e:
            logger.error(f"Error canceling order {order_ticket}: {e}")
            raise MT5TradingError(f"Failed to cancel order: {e}")
    
    # Position and Order Management
    async def get_positions(self, symbol: Optional[str] = None) -> List[Position]:
        """Get open positions"""
        await self._ensure_connected()
        
        try:
            if symbol:
                positions = mt5.positions_get(symbol=symbol)
            else:
                positions = mt5.positions_get()
            
            if positions is None:
                return []
            
            position_list = []
            for pos in positions:
                position_list.append(Position(
                    ticket=pos.ticket,
                    time=datetime.fromtimestamp(pos.time),
                    time_msc=pos.time_msc,
                    time_update=datetime.fromtimestamp(pos.time_update),
                    time_update_msc=pos.time_update_msc,
                    type=pos.type,
                    magic=pos.magic,
                    identifier=pos.identifier,
                    reason=pos.reason,
                    volume=pos.volume,
                    price_open=pos.price_open,
                    sl=pos.sl,
                    tp=pos.tp,
                    price_current=pos.price_current,
                    swap=pos.swap,
                    profit=pos.profit,
                    symbol=pos.symbol,
                    comment=pos.comment,
                    external_id=pos.external_id
                ))
            
            return position_list
        except Exception as e:
            logger.error(f"Error getting positions: {e}")
            raise MT5TradingError(f"Failed to get positions: {e}")
    
    async def get_orders(self, symbol: Optional[str] = None) -> List[Order]:
        """Get pending orders"""
        await self._ensure_connected()
        
        try:
            if symbol:
                orders = mt5.orders_get(symbol=symbol)
            else:
                orders = mt5.orders_get()
            
            if orders is None:
                return []
            
            order_list = []
            for order in orders:
                order_list.append(Order(
                    ticket=order.ticket,
                    time_setup=datetime.fromtimestamp(order.time_setup),
                    time_setup_msc=order.time_setup_msc,
                    time_done=datetime.fromtimestamp(order.time_done) if order.time_done else datetime.min,
                    time_done_msc=order.time_done_msc,
                    time_expiration=datetime.fromtimestamp(order.time_expiration) if order.time_expiration else datetime.max,
                    type=order.type,
                    type_time=order.type_time,
                    type_filling=order.type_filling,
                    state=order.state,
                    magic=order.magic,
                    position_id=order.position_id,
                    position_by_id=order.position_by_id,
                    reason=order.reason,
                    volume_initial=order.volume_initial,
                    volume_current=order.volume_current,
                    price_open=order.price_open,
                    sl=order.sl,
                    tp=order.tp,
                    price_current=order.price_current,
                    price_stoplimit=order.price_stoplimit,
                    symbol=order.symbol,
                    comment=order.comment,
                    external_id=order.external_id
                ))
            
            return order_list
        except Exception as e:
            logger.error(f"Error getting orders: {e}")
            raise MT5TradingError(f"Failed to get orders: {e}")
    
    async def get_trade_history(
        self, 
        start_date: Optional[datetime] = None, 
        end_date: Optional[datetime] = None,
        symbol: Optional[str] = None
    ) -> List[Deal]:
        """Get trade history (closed deals)"""
        await self._ensure_connected()
        
        try:
            if start_date is None:
                start_date = datetime.now() - timedelta(days=30)  # Last 30 days
            if end_date is None:
                end_date = datetime.now()
            
            if symbol:
                deals = mt5.history_deals_get(start_date, end_date, symbol=symbol)
            else:
                deals = mt5.history_deals_get(start_date, end_date)
            
            if deals is None:
                return []
            
            deal_list = []
            for deal in deals:
                deal_list.append(Deal(
                    ticket=deal.ticket,
                    order=deal.order,
                    time=datetime.fromtimestamp(deal.time),
                    time_msc=deal.time_msc,
                    type=deal.type,
                    entry=deal.entry,
                    magic=deal.magic,
                    position_id=deal.position_id,
                    reason=deal.reason,
                    volume=deal.volume,
                    price=deal.price,
                    commission=deal.commission,
                    swap=deal.swap,
                    profit=deal.profit,
                    fee=deal.fee,
                    symbol=deal.symbol,
                    comment=deal.comment,
                    external_id=deal.external_id
                ))
            
            return deal_list
        except Exception as e:
            logger.error(f"Error getting trade history: {e}")
            raise MT5TradingError(f"Failed to get trade history: {e}")
    
    async def get_order_status(self, order_ticket: int) -> Optional[Dict[str, Any]]:
        """Get order execution status"""
        await self._ensure_connected()
        
        try:
            # Check if it's a pending order
            order_info = mt5.orders_get(ticket=order_ticket)
            if order_info:
                order = order_info[0]
                return {
                    "ticket": order.ticket,
                    "status": "pending",
                    "state": order.state,
                    "volume_initial": order.volume_initial,
                    "volume_current": order.volume_current,
                    "time_setup": datetime.fromtimestamp(order.time_setup),
                    "symbol": order.symbol,
                    "type": order.type
                }
            
            # Check if it's in history
            history_orders = mt5.history_orders_get(ticket=order_ticket)
            if history_orders:
                order = history_orders[0]
                return {
                    "ticket": order.ticket,
                    "status": "executed" if order.state == OrderState.FILLED else "canceled",
                    "state": order.state,
                    "volume_initial": order.volume_initial,
                    "volume_current": order.volume_current,
                    "time_setup": datetime.fromtimestamp(order.time_setup),
                    "time_done": datetime.fromtimestamp(order.time_done) if order.time_done else None,
                    "symbol": order.symbol,
                    "type": order.type
                }
            
            return None
        except Exception as e:
            logger.error(f"Error getting order status for {order_ticket}: {e}")
            raise MT5TradingError(f"Failed to get order status: {e}")
    
    # Utility Methods
    async def get_symbols_list(self) -> List[str]:
        """Get list of available symbols"""
        await self._ensure_connected()
        
        try:
            symbols = mt5.symbols_get()
            if symbols is None:
                return []
            
            return [symbol.name for symbol in symbols]
        except Exception as e:
            logger.error(f"Error getting symbols list: {e}")
            raise MT5TradingError(f"Failed to get symbols list: {e}")
    
    async def calculate_margin(self, symbol: str, volume: float, order_type: OrderType) -> Optional[float]:
        """Calculate required margin for a trade"""
        await self._ensure_connected()
        
        try:
            action = mt5.ORDER_TYPE_BUY if order_type == OrderType.BUY else mt5.ORDER_TYPE_SELL
            margin = mt5.order_calc_margin(action, symbol, volume, 0.0)
            return margin
        except Exception as e:
            logger.error(f"Error calculating margin: {e}")
            return None
    
    async def calculate_profit(
        self, 
        symbol: str, 
        volume: float, 
        order_type: OrderType, 
        open_price: float, 
        close_price: float
    ) -> Optional[float]:
        """Calculate profit for a trade"""
        await self._ensure_connected()
        
        try:
            action = mt5.ORDER_TYPE_BUY if order_type == OrderType.BUY else mt5.ORDER_TYPE_SELL
            profit = mt5.order_calc_profit(action, symbol, volume, open_price, close_price)
            return profit
        except Exception as e:
            logger.error(f"Error calculating profit: {e}")
            return None
