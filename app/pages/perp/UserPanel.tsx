// src/components/UserPanel.tsx
import React, { useState } from "react";
import {
  usePositionStream,
  useOrderStream,
  usePositionActions,
} from "@orderly.network/hooks";
import { API, OrderSide, OrderStatus } from "@orderly.network/types";

interface UserPanelProps {
  symbol: string;
}

const UserPanel: React.FC<UserPanelProps> = ({ symbol }) => {
  const [activeTab, setActiveTab] = useState<"POSITIONS" | "OPEN_ORDERS">(
    "POSITIONS"
  );

  return (
    <div className="bg-[#1f2937] rounded-lg border border-gray-700 min-h-[300px] flex flex-col shadow-lg">
      {/* Tabs Header */}
      <div className="flex border-b border-gray-700">
        <button
          className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === "POSITIONS"
              ? "text-blue-400 border-blue-400 bg-gray-700/20"
              : "text-gray-400 border-transparent hover:text-white"
          }`}
          onClick={() => setActiveTab("POSITIONS")}
        >
          Positions
        </button>
        <button
          className={`px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === "OPEN_ORDERS"
              ? "text-blue-400 border-blue-400 bg-gray-700/20"
              : "text-gray-400 border-transparent hover:text-white"
          }`}
          onClick={() => setActiveTab("OPEN_ORDERS")}
        >
          Open Orders
        </button>
      </div>

      {/* Content Area */}
      <div className="p-0 flex-1 overflow-x-auto">
        {activeTab === "POSITIONS" ? (
          <PositionsTable symbol={symbol} />
        ) : (
          <OpenOrdersTable symbol={symbol} />
        )}
      </div>
    </div>
  );
};

// --- Sub-component: Positions Table ---
const PositionsTable = ({ symbol }: { symbol: string }) => {
  // usePositionStream trả về tuple: [data, info, status]
  const [data, , { isLoading }] = usePositionStream(symbol);
  const { closePosition } = usePositionActions();

  if (isLoading)
    return (
      <div className="p-4 text-gray-400 text-xs">Loading positions...</div>
    );

  // Kiểm tra nếu không có rows hoặc rows rỗng
  if (!data?.rows || data.rows.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm">
        No open positions.
      </div>
    );
  }

  return (
    <table className="w-full text-left border-collapse">
      <thead className="bg-gray-900/50 text-xs text-gray-400 uppercase">
        <tr>
          <th className="p-3">Symbol</th>
          <th className="p-3">Side</th>
          <th className="p-3 text-right">Size</th>
          <th className="p-3 text-right">Entry Price</th>
          <th className="p-3 text-right">Mark Price</th>
          <th className="p-3 text-right">Liq. Price</th>
          <th className="p-3 text-right">uPNL</th>
          <th className="p-3 text-center">Action</th>
        </tr>
      </thead>
      <tbody className="text-sm text-white divide-y divide-gray-800">
        {data.rows.map((pos: API.PositionTPSLExt) => {
          const isLong = pos.position_qty > 0;
          const pnl = pos.unrealized_pnl || 0;
          const pnlColor = pnl >= 0 ? "text-green-500" : "text-red-500";

          return (
            <tr
              key={pos.symbol}
              className="hover:bg-gray-700/30 transition-colors"
            >
              <td className="p-3 font-bold">{pos.symbol}</td>
              <td
                className={`p-3 font-semibold ${
                  isLong ? "text-green-500" : "text-red-500"
                }`}
              >
                {isLong ? "LONG" : "SHORT"}
              </td>
              <td className="p-3 text-right">{Math.abs(pos.position_qty)}</td>
              <td className="p-3 text-right">
                {pos.average_open_price?.toFixed(2)}
              </td>
              <td className="p-3 text-right">{pos.mark_price?.toFixed(2)}</td>
              <td className="p-3 text-right text-orange-400">
                {pos.est_liq_price ? pos.est_liq_price.toFixed(2) : "--"}
              </td>
              <td className={`p-3 text-right font-mono ${pnlColor}`}>
                {pnl > 0 ? "+" : ""}
                {pnl.toFixed(2)}
              </td>
              <td className="p-3 text-center">
                <button
                  onClick={() => closePosition(pos.symbol)}
                  className="bg-gray-700 hover:bg-gray-600 border border-gray-600 text-xs px-3 py-1 rounded transition-colors"
                >
                  Close
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

// --- Sub-component: Open Orders Table ---
const OpenOrdersTable = ({ symbol }: { symbol: string }) => {
  // useOrderStream trả về tuple: [data, meta]
  // Lọc lấy các lệnh chưa hoàn thành (INCOMPLETE)
  const [orders, { cancelOrder, cancelAllPendingOrders, isLoading }] =
    useOrderStream({
      symbol,
      status: OrderStatus.INCOMPLETE,
    });

  const handleCancel = async (orderId: number) => {
    try {
      await cancelOrder(orderId, symbol);
    } catch (e) {
      console.error("Cancel failed:", e);
    }
  };

  if (isLoading && (!orders || orders.length === 0))
    return <div className="p-4 text-gray-400 text-xs">Loading orders...</div>;
  if (!orders || orders.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm">
        No open orders.
      </div>
    );
  }

  return (
    <div>
      <div className="p-2 flex justify-end bg-gray-900/30">
        <button
          onClick={() => cancelAllPendingOrders(symbol)}
          className="text-xs text-red-400 hover:text-red-300 border border-red-900/50 px-2 py-1 rounded hover:bg-red-900/20 transition-colors"
        >
          Cancel All {symbol}
        </button>
      </div>

      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-900/50 text-xs text-gray-400 uppercase">
          <tr>
            <th className="p-3">Time</th>
            <th className="p-3">Type</th>
            <th className="p-3">Side</th>
            <th className="p-3 text-right">Price</th>
            <th className="p-3 text-right">Qty</th>
            <th className="p-3 text-right">Filled</th>
            <th className="p-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="text-sm text-white divide-y divide-gray-800">
          {/* Ép kiểu về API.Order để TypeScript hiểu các trường */}
          {(orders as API.Order[]).map((order) => (
            <tr
              key={order.order_id}
              className="hover:bg-gray-700/30 transition-colors"
            >
              <td className="p-3 text-gray-400 text-xs">
                {new Date(order.created_time).toLocaleTimeString()}
              </td>
              <td className="p-3 text-xs">{order.type}</td>
              <td
                className={`p-3 font-semibold ${
                  order.side === OrderSide.BUY
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {order.side}
              </td>
              <td className="p-3 text-right">
                {order.price ? order.price.toFixed(2) : "Market"}
              </td>
              <td className="p-3 text-right">{order.quantity}</td>
              <td className="p-3 text-right text-gray-400">
                {order.total_executed_quantity || 0}
              </td>
              <td className="p-3 text-center">
                <button
                  onClick={() => handleCancel(order.order_id)}
                  className="text-red-500 hover:text-red-400 text-xs border border-red-500/30 hover:bg-red-500/10 px-2 py-1 rounded transition-colors"
                >
                  Cancel
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserPanel;
