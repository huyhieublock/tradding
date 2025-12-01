import React from "react";
import { OrderBookItem, useOrderbookStream } from "@orderly.network/hooks";

interface OrderBookProps {
  symbol: string;
}

const OrderBookPanel: React.FC<OrderBookProps> = ({ symbol }) => {
  const orderBookStream = useOrderbookStream(symbol);

  const renderRows = ({
    type,
    asks,
    bids,
  }: {
    type: "BUY" | "SELL";
    asks?: OrderBookItem[];
    bids?: OrderBookItem[];
  }) => {
    // Chỉ hiển thị 10 mức giá đầu tiên
    const rows =
      type === "BUY" ? bids?.slice(0, 10) : asks?.slice(0, 10)?.reverse();

    return rows?.map(([price, quantity], index) => {
      // Tính toán độ sâu (depth) cho thanh màu nền
      const maxQty =
        Math.max(
          ...(bids?.map((b) => b[1]) || []),
          ...(asks?.map((a) => a[1]) || [])
        ) || 1;
      const depth = (quantity / maxQty) * 100;

      return (
        <div
          key={index}
          className={`flex justify-between px-2 py-[2px] text-sm relative cursor-pointer
              ${type === "BUY" ? "text-green-400" : "text-red-400"}`}
        >
          {/* Thanh màu nền hiển thị độ sâu */}
          <div
            style={{ width: `${depth}%` }}
            className={`absolute ${
              type === "BUY" ? "bg-green-900/50" : "bg-red-900/50"
            } right-0 top-0 bottom-0 z-0`}
          />
          <span className="z-10">{price.toFixed(4)}</span>
          <span className="z-10">{quantity.toFixed(4)}</span>
        </div>
      );
    });
  };

  return (
    <div className="bg-gray-800 p-3 rounded-lg h-[400px] overflow-hidden flex flex-col">
      <h3 className="text-xl font-semibold mb-2">Sổ Lệnh ({symbol})</h3>

      {orderBookStream.map((data, index) => {
        const latestPrice = data.bids?.[0]?.[0] || 0;

        return (
          <React.Fragment key={index}>
            {/* Asks (Bán) */}
            <div className="flex-1 overflow-y-auto order-3">
              {renderRows({
                type: "BUY",
                asks: data.asks,
                bids: data.bids,
              })}
            </div>
            {/* Giá thị trường hiện tại */}
            <div className="text-center py-2 my-1 border-y border-gray-700 order-2">
              <span
                className={`text-2xl font-bold ${
                  latestPrice >= (data.bids?.[0]?.[0] || 0)
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {latestPrice ? Number(latestPrice).toFixed(4) : "--"}
              </span>
            </div>

            {/* Bids (Mua) */}
            <div className="flex-1 overflow-y-auto order-1">
              {renderRows({
                type: "SELL",
                asks: data.asks,
                bids: data.bids,
              })}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default OrderBookPanel;
