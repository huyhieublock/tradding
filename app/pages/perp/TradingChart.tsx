// src/components/TradingChart.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  Time,
} from "lightweight-charts";
import { useTickerStream } from "@orderly.network/hooks";

interface TradingChartProps {
  symbol: string;
}

// Orderly API URL (Testnet)
const API_URL = "https://testnet-api.orderly.org/v1";
// Nếu mainnet: 'https://api.orderly.org/v1'

const TradingChart: React.FC<TradingChartProps> = ({ symbol }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // Dùng hook này để nhận giá real-time update cho cây nến cuối cùng
  const ticker = useTickerStream(symbol);

  // State để quản lý resolution (khung thời gian)
  const [resolution, setResolution] = useState<string>("15"); // 15 phút mặc định

  // 1. Khởi tạo Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#1f2937" }, // Màu nền khớp với dark mode (gray-800)
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "#374151" },
        horzLines: { color: "#374151" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: "#22c55e", // Màu xanh (Tailwind green-500)
      downColor: "#ef4444", // Màu đỏ (Tailwind red-500)
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    // Responsive: Tự resize khi cửa sổ thay đổi
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // 2. Fetch Dữ liệu Lịch sử (Historical Data)
  const fetchHistory = useCallback(async () => {
    if (!candlestickSeriesRef.current) return;

    // Tính toán thời gian: Lấy 1000 cây nến gần nhất
    const to = Math.floor(Date.now() / 1000);
    // Ước lượng 'from' dựa trên resolution (chỉ là ước lượng sơ bộ)
    const from =
      to - 1000 * 60 * parseInt(resolution === "1D" ? "1440" : resolution);

    try {
      // Gọi API Public của Orderly để lấy K-lines
      const res = await fetch(
        `${API_URL}/public/tv/history?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}`
      );
      const data = await res.json();

      if (data.s === "ok" && data.t && data.t.length > 0) {
        // Map dữ liệu từ API Orderly sang format của lightweight-charts
        const candles = data.t.map((time: number, index: number) => ({
          time: time as Time, // API trả về seconds
          open: data.o[index],
          high: data.h[index],
          low: data.l[index],
          close: data.c[index],
        }));

        // Set dữ liệu vào chart
        candlestickSeriesRef.current.setData(candles);
      }
    } catch (error) {
      console.error("Failed to fetch chart history:", error);
    }
  }, [symbol, resolution]);

  // Gọi fetchHistory khi symbol hoặc resolution thay đổi
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // 3. Update Real-time (Cập nhật cây nến cuối cùng)
  useEffect(() => {
    if (!candlestickSeriesRef.current || !ticker || !ticker.mark_price) return;

    // Logic đơn giản: Update giá close của cây nến cuối cùng
    // Lưu ý: Để chuẩn xác 100% cần logic phức tạp hơn để tạo nến mới khi qua phút mới.
    // Đây là logic cơ bản để bạn thấy giá nhảy.

    // Lấy cây nến cuối cùng hiện có trên chart
    const data = candlestickSeriesRef.current.data();
    if (data.length > 0) {
      const lastCandle = data[data.length - 1] as any;

      // Update giá High/Low/Close
      const updatedCandle = {
        ...lastCandle,
        close: ticker.mark_price,
        high: Math.max(lastCandle.high, ticker.mark_price),
        low: Math.min(lastCandle.low, ticker.mark_price),
      };

      candlestickSeriesRef.current.update(updatedCandle);
    }
  }, [ticker]); // Chạy mỗi khi ticker (giá) thay đổi

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 h-[450px] flex flex-col">
      {/* Chart Header & Timeframe Selector */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-white">Biểu đồ: {symbol}</h3>
        <div className="flex space-x-2">
          {["1", "5", "15", "60", "1D"].map((tf) => (
            <button
              key={tf}
              onClick={() => setResolution(tf)}
              className={`px-2 py-1 text-xs rounded ${
                resolution === tf
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {tf === "1D" ? "1D" : `${tf}m`}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div ref={chartContainerRef} className="flex-1 w-full" />
    </div>
  );
};

export default TradingChart;
