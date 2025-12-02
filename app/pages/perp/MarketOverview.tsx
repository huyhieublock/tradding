import React, { useMemo } from "react";
import { useTickerStream } from "@orderly.network/hooks";
import { Loader2 } from "lucide-react";

interface MarketOverviewProps {
  symbol: string;
}

const MarketOverview: React.FC<MarketOverviewProps> = ({ symbol }) => {
  // Lấy dữ liệu ticker realtime
  const ticker = useTickerStream(symbol);

  // Tính toán các chỉ số an toàn
  const { currentPrice, changePercent, changeAmount, volume24h, openPrice } =
    useMemo(() => {
      if (!ticker) {
        return {
          currentPrice: 0,
          changePercent: 0,
          changeAmount: 0,
          volume24h: 0,
          openPrice: 0,
        };
      }

      // Lấy giá Mark Price làm giá hiện tại
      const price = ticker.mark_price ?? 0;
      // Lấy giá mở cửa 24h trước
      const open = ticker["24h_open"] ?? price;
      // Lấy Volume (USDC amount)
      const vol = ticker["24h_amount"] ?? 0;

      // Tự tính % thay đổi để đảm bảo chính xác: (Giá trị hiện tại - Giá mở cửa) / Giá mở cửa
      let percent = 0;
      let amount = 0;

      if (open > 0) {
        amount = price - open;
        percent = (amount / open) * 100;
      }

      return {
        currentPrice: price,
        changePercent: percent,
        changeAmount: amount,
        volume24h: vol,
        openPrice: open,
      };
    }, [ticker]);

  // Format số tiền (VD: 39.02M)
  const formatVolume = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
    if (num >= 1000) return (num / 1000).toFixed(2) + "K";
    return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
  };

  // Format giá (giữ 2 số thập phân như ảnh)
  const formatPrice = (num: number) => {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Xác định màu sắc (Xanh/Đỏ)
  const isPositive = changePercent >= 0;
  const colorClass = isPositive ? "text-[#00E5AE]" : "text-[#FF4D4F]"; // Màu xanh ngọc/đỏ chuẩn
  const sign = isPositive && changePercent > 0 ? "+" : "";

  // Loading state
  if (!ticker) {
    return (
      <div className="flex h-[72px] w-full items-center justify-center rounded-lg border border-[#1f2229] bg-[#1b1d22]">
        <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="flex h-[72px] w-full items-center justify-between rounded-lg border border-[#1f2229] bg-[#1b1d22] px-6 shadow-sm">
      {/* 1. Symbol Info */}
      <div className="flex flex-col">
        <h1 className="text-lg font-bold text-white tracking-wide">{symbol}</h1>
        <span className="text-xs font-medium text-[#808691]">Perpetual</span>
      </div>

      {/* 2. Mark Price (Center-Left) */}
      <div className="flex flex-col items-end">
        <span className={`text-2xl font-bold font-mono ${colorClass}`}>
          {formatPrice(currentPrice)}
        </span>
        <span className="text-xs font-medium text-[#808691]">Mark Price</span>
      </div>

      {/* 3. 24h Stats (Center-Right & Right) */}
      <div className="flex gap-12">
        {/* 24h Change */}
        <div className="flex flex-col items-end">
          <span className={`text-sm font-medium ${colorClass}`}>
            {sign}
            {changePercent.toFixed(2)}%
          </span>
          <span className="text-xs font-medium text-[#808691]">24h Change</span>
        </div>

        {/* 24h Volume */}
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium text-white">
            {formatVolume(volume24h)}
          </span>
          <span className="text-xs font-medium text-[#808691]">
            24h Vol (USDC)
          </span>
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;
