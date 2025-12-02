// src/components/OrderBookPanel.tsx
import React, { useMemo } from "react";
import { useOrderbookStream, useTickerStream } from "@orderly.network/hooks";
import { ArrowDown, ArrowUp, EllipsisIcon } from "lucide-react";

interface OrderBookPanelProps {
  symbol: string;
}

// Hàm format số lượng (VD: 17.41K)
const formatCompact = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
  if (num >= 1000) return (num / 1000).toFixed(2) + "K";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
};

// Hàm format giá tiền
const formatPrice = (price: number) => {
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const OrderBookPanel: React.FC<OrderBookPanelProps> = ({ symbol }) => {
  // 1. Lấy tên Token Base từ Symbol (VD: PERP_ETH_USDC -> ETH)
  const baseToken = useMemo(() => {
    if (!symbol) return "";
    const parts = symbol.split("_");
    // Cấu trúc thường là TYPE_BASE_QUOTE (PERP_ETH_USDC) -> Lấy phần tử thứ 2
    return parts.length >= 2 ? parts[1] : "BTC";
  }, [symbol]);

  // 2. Lấy dữ liệu Orderbook (Destructuring mảng theo đúng Type bạn cung cấp)
  // [0]: Data (asks, bids, markPrice)
  // [1]: Meta (isLoading, onDepthChange...)
  const [obData, obConfig] = useOrderbookStream(symbol);

  // 3. Lấy dữ liệu Ticker để hiển thị Last Price ở giữa (vì Orderbook không có lastPrice)
  const ticker = useTickerStream(symbol);

  // Destructure an toàn
  const asks = useMemo(() => obData?.asks || [], [obData]);
  const bids = useMemo(() => obData?.bids || [], [obData]);

  // Ưu tiên lấy markPrice từ ticker (nhanh hơn), nếu không có thì lấy từ orderbook
  const markPrice = ticker?.mark_price || obData?.markPrice || 0;

  // Giá Last Price (Dùng để so sánh màu sắc)
  // Trong Type TickerStream có mark_price, dùng nó đại diện cho giá hiện tại
  const currentPrice = ticker?.mark_price || 0;

  // Cấu hình hiển thị số dòng
  const ROW_COUNT = 14;

  // --- Xử lý ASKS (Bán) ---
  const renderAsks = useMemo(() => {
    // Lấy 14 lệnh đầu tiên
    const sliced = asks.slice(0, ROW_COUNT);
    // Đảo ngược: Giá thấp nhất ở dưới cùng (gần middle bar)
    return [...sliced].reverse();
  }, [asks]);

  // --- Xử lý BIDS (Mua) ---
  const renderBids = useMemo(() => {
    return bids.slice(0, ROW_COUNT);
  }, [bids]);

  // --- Tính Max Volume cho thanh Depth Bar ---
  const maxVolume = useMemo(() => {
    const maxAsk = Math.max(...renderAsks.map(([_, qty]) => qty), 0);
    const maxBid = Math.max(...renderBids.map(([_, qty]) => qty), 0);
    return Math.max(maxAsk, maxBid) || 1;
  }, [renderAsks, renderBids]);

  // --- Component con: Một dòng lệnh ---
  const OrderRow = ({
    item,
    type,
    maxVol,
  }: {
    item: number[];
    type: "buy" | "sell";
    maxVol: number;
  }) => {
    const price = item[0];
    const amount = item[1];
    const total = price * amount;
    const depthWidth = `${Math.min((amount / maxVol) * 100, 100)}%`;

    return (
      <div className="flex justify-between items-center text-xs py-[2px] relative group hover:bg-gray-800 cursor-pointer">
        <div
          className={`absolute top-0 bottom-0 right-0 opacity-20 z-0 transition-all duration-200 ${
            type === "sell" ? "bg-red-500" : "bg-green-500"
          }`}
          style={{ width: depthWidth }}
        />
        <span
          className={`z-10 w-[30%] text-left pl-2 font-mono ${
            type === "sell" ? "text-red-400" : "text-emerald-400"
          }`}
        >
          {formatPrice(price)}
        </span>
        <span className="z-10 w-[35%] text-right font-mono text-gray-300">
          {amount.toFixed(4)}
        </span>
        <span className="z-10 w-[35%] text-right pr-2 font-mono text-gray-500">
          {formatCompact(total)}
        </span>
      </div>
    );
  };

  if (obConfig.isLoading && !asks.length) {
    return (
      <div className="bg-[#111827] h-[550px] flex items-center justify-center text-gray-500 text-xs">
        Loading Orderbook...
      </div>
    );
  }

  return (
    <div className="bg-[#111827] border border-gray-700 rounded-lg w-full flex flex-col h-[550px] overflow-hidden shadow-xl select-none">
      {/* HEADER */}
      <div className="flex justify-between items-center p-3 border-b border-gray-800">
        <h3 className="text-sm font-bold text-white">Order Book</h3>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-800 rounded p-0.5">
            <button className="p-1 hover:bg-gray-700 rounded text-gray-400">
              <EllipsisIcon />
            </button>
          </div>
        </div>
      </div>

      {/* COLUMN HEADERS - Dynamic Token Name */}
      <div className="flex justify-between text-[10px] text-gray-500 uppercase font-semibold py-2 px-1">
        <span className="w-[30%] pl-2 text-left">Price (USDC)</span>
        <span className="w-[35%] text-right">Amount ({baseToken})</span>
        <span className="w-[35%] pr-2 text-right">Total</span>
      </div>

      {/* ASKS (SELL) */}
      <div className="flex-1 overflow-hidden flex flex-col justify-end">
        {renderAsks.map((item, idx) => (
          <OrderRow
            key={`ask-${idx}`}
            item={item}
            type="sell"
            maxVol={maxVolume}
          />
        ))}
      </div>

      {/* MIDDLE BAR (Current Price) */}
      <div className="py-2 px-3 my-1 border-y border-gray-800 flex items-center justify-between bg-gray-800/50">
        <div className="flex items-center gap-2">
          {/* Hiển thị giá hiện tại từ Ticker */}
          <span
            className={`text-xl font-bold font-mono ${
              (ticker?.["24h_change"] || 0) >= 0
                ? "text-emerald-400"
                : "text-red-400"
            }`}
          >
            {formatPrice(currentPrice)}
          </span>
          {(ticker?.["24h_change"] || 0) >= 0 ? (
            <ArrowUp className="text-emerald-400" />
          ) : (
            <ArrowDown className="text-red-400" />
          )}
        </div>

        {/* Mark Price nhỏ hơn bên cạnh */}
        <span
          className="text-xs text-gray-500 underline decoration-dotted cursor-help"
          title="Mark Price"
        >
          {formatPrice(markPrice)}
        </span>
      </div>

      {/* BIDS (BUY) */}
      <div className="flex-1 overflow-hidden">
        {renderBids.map((item, idx) => (
          <OrderRow
            key={`bid-${idx}`}
            item={item}
            type="buy"
            maxVol={maxVolume}
          />
        ))}
      </div>
    </div>
  );
};

export default OrderBookPanel;
