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
    <div className="bg-gray-800 rounded-lg border border-gray-700 min-h-[300px] flex flex-col">
      {/* Tabs Header */}
      <div className="flex border-b border-gray-700">
        <button
          className={`px-6 py-3 font-semibold text-sm transition-colors ${
            activeTab === "POSITIONS"
              ? "text-blue-400 border-b-2 border-blue-400 bg-gray-700/50"
              : "text-gray-400 hover:text-white"
          }`}
          onClick={() => setActiveTab("POSITIONS")}
        >
          Vị thế (Positions)
        </button>
        <button
          className={`px-6 py-3 font-semibold text-sm transition-colors ${
            activeTab === "OPEN_ORDERS"
              ? "text-blue-400 border-b-2 border-blue-400 bg-gray-700/50"
              : "text-gray-400 hover:text-white"
          }`}
          onClick={() => setActiveTab("OPEN_ORDERS")}
        >
          Lệnh mở (Open Orders)
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
  // Lấy toàn bộ vị thế (symbol='all' hoặc để trống nếu muốn xem portfolio,
  // ở đây ta lọc theo symbol hiện tại hoặc hiển thị tất cả nếu muốn)
  // Trong d.ts: usePositionStream(symbol?: string, ...)
  const [data, info, { isLoading }] = usePositionStream(symbol);

  // Lấy action đóng vị thế nhanh
  const { closePosition } = usePositionActions();

  if (isLoading)
    return <div className="p-4 text-gray-400 text-sm">Đang tải vị thế...</div>;
  if (!data?.rows || data.rows.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm">
        Không có vị thế mở nào.
      </div>
    );
  }

  return (
    <table className="w-full text-left border-collapse">
      <thead className="bg-gray-900 text-xs text-gray-400 uppercase">
        <tr>
          <th className="p-3">Symbol</th>
          <th className="p-3">Side</th>
          <th className="p-3 text-right">Size</th>
          <th className="p-3 text-right">Entry Price</th>
          <th className="p-3 text-right">Mark Price</th>
          <th className="p-3 text-right">Est. Liq Price</th>
          <th className="p-3 text-right">Unrealized PnL</th>
          <th className="p-3 text-center">Action</th>
        </tr>
      </thead>
      <tbody className="text-sm text-white divide-y divide-gray-700">
        {data.rows.map((pos: API.PositionTPSLExt) => {
          // position_qty > 0 là Long, < 0 là Short
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
                {pos.average_open_price.toFixed(4)}
              </td>
              <td className="p-3 text-right">{pos.mark_price.toFixed(4)}</td>
              <td className="p-3 text-right text-orange-400">
                {pos.est_liq_price ? pos.est_liq_price.toFixed(4) : "--"}
              </td>
              <td className={`p-3 text-right font-mono ${pnlColor}`}>
                {pnl > 0 ? "+" : ""}
                {pnl.toFixed(2)} USDC
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
  // Sử dụng useOrderStream để lấy lệnh chưa hoàn thành (INCOMPLETE)
  const [orders, { cancelOrder, cancelAllPendingOrders, isLoading }] =
    useOrderStream({
      symbol, // Lọc theo cặp hiện tại
      status: OrderStatus.INCOMPLETE, // Chỉ lấy lệnh đang chờ
    });

  const handleCancel = async (orderId: number) => {
    try {
      await cancelOrder(orderId, symbol);
    } catch (e) {
      console.error("Lỗi hủy lệnh:", e);
      alert("Không thể hủy lệnh");
    }
  };

  if (isLoading && (!orders || orders.length === 0))
    return <div className="p-4 text-gray-400 text-sm">Đang tải lệnh...</div>;
  if (!orders || orders.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 text-sm">
        Không có lệnh chờ nào.
      </div>
    );
  }

  return (
    <div>
      {/* Nút Hủy tất cả */}
      <div className="p-2 flex justify-end bg-gray-900/50">
        <button
          onClick={() => cancelAllPendingOrders(symbol)}
          className="text-xs text-red-400 hover:text-red-300 underline"
        >
          Hủy tất cả lệnh {symbol}
        </button>
      </div>

      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-900 text-xs text-gray-400 uppercase">
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
        <tbody className="text-sm text-white divide-y divide-gray-700">
          {orders.map((order) => (
            <tr
              key={order.order_id}
              className="hover:bg-gray-700/30 transition-colors"
            >
              <td className="p-3 text-gray-400 text-xs">
                {new Date(order.created_time).toLocaleTimeString()}
              </td>
              <td className="p-3">{order.type || "LIMIT"}</td>
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
                {order.price ? order.price.toFixed(4) : "Market"}
              </td>
              <td className="p-3 text-right">{order.quantity}</td>
              <td className="p-3 text-right text-gray-400">
                {order.executed_quantity || 0}
              </td>
              <td className="p-3 text-center">
                <button
                  onClick={() => handleCancel(order.order_id)}
                  className="text-red-500 hover:text-red-400 font-bold text-xs border border-red-500/30 hover:bg-red-500/10 px-2 py-1 rounded"
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
