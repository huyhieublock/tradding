// src/components/MarketOverview.tsx
import React from "react";
// Dùng useTickerStream từ file type bạn cung cấp
import { useTickerStream } from "@orderly.network/hooks";

interface MarketOverviewProps {
  symbol: string;
}

const MarketOverview: React.FC<MarketOverviewProps> = ({ symbol }) => {
  // Hook này trả về trực tiếp object data (API.MarketInfo)
  const ticker = useTickerStream(symbol);

  // Kiểm tra nếu chưa có dữ liệu (thường ticker sẽ undefined hoặc rỗng lúc đầu)
  if (!ticker || !ticker.mark_price) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg flex justify-between mb-4 animate-pulse">
        <div className="h-8 bg-gray-700 w-1/3 rounded"></div>
        <div className="h-8 bg-gray-700 w-1/4 rounded"></div>
      </div>
    );
  }

  // Lấy dữ liệu từ ticker
  // Lưu ý: trong type bạn gửi, nó trả về "24h_change" (có thể undefined)
  const price = ticker.mark_price;
  const changePercent = (ticker["24h_change"] || 0) * 100;
  const volume24h = ticker["24h_amount"] || 0; // '24h_amount' thường là volume theo Quote (USDC)

  const changeColor = changePercent >= 0 ? "text-green-500" : "text-red-500";
  const changeSign = changePercent >= 0 ? "+" : "";

  return (
    <div className="bg-gray-800 p-4 rounded-lg flex flex-wrap justify-between items-center mb-4 border border-gray-700 shadow-lg">
      {/* Symbol Info */}
      <div className="flex flex-col">
        <h2 className="text-2xl font-bold text-white">{symbol}</h2>
        <span className="text-xs text-gray-400">Perpetual</span>
      </div>

      {/* Price */}
      <div className="flex flex-col items-end">
        <span className={`text-3xl font-mono font-bold ${changeColor}`}>
          {price.toFixed(2)}
        </span>
        <span className="text-xs text-gray-400">Mark Price</span>
      </div>

      {/* 24h Change */}
      <div className="flex flex-col items-end">
        <span className={`text-lg font-medium ${changeColor}`}>
          {changeSign}
          {changePercent.toFixed(2)}%
        </span>
        <span className="text-xs text-gray-400">24h Change</span>
      </div>

      {/* 24h Volume */}
      <div className="flex flex-col items-end hidden md:flex">
        <span className="text-lg font-medium text-white">
          {(volume24h / 1_000_000).toFixed(2)}M
        </span>
        <span className="text-xs text-gray-400">24h Vol (USDC)</span>
      </div>
    </div>
  );
};

export default MarketOverview;
