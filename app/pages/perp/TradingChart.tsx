// src/components/TradingChart.tsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickSeries, // Import Series Definition từ type bạn gửi
  UTCTimestamp,
  CandlestickData,
} from "lightweight-charts";
import { useTickerStream } from "@orderly.network/hooks";

interface TradingChartProps {
  symbol: string;
}

const API_BASE = "/api/orderly";

const TradingChart: React.FC<TradingChartProps> = ({ symbol }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // Định nghĩa rõ kiểu cho Series API dựa trên 'Candlestick'
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // Hook lấy giá realtime để cập nhật nến cuối cùng
  const ticker = useTickerStream(symbol);

  // State khung thời gian (15 phút mặc định)
  const [resolution, setResolution] = useState<string>("15");

  // --- 1. Khởi tạo Chart ---
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Tạo chart instance
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#111827" }, // gray-900 (Tailwind)
        textColor: "#9ca3af", // gray-400
      },
      grid: {
        vertLines: { color: "#374151" }, // gray-700
        horzLines: { color: "#374151" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 450,
      autoSize: true, // Tự động resize theo container (Tính năng có trong type)
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Thêm Candlestick Series theo cách mới của v4
    const newSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e", // green-500
      downColor: "#ef4444", // red-500
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = newSeries;

    // Cleanup khi unmount
    return () => {
      chart.remove();
    };
  }, []); // Chỉ chạy 1 lần khi mount

  // --- 2. Fetch Dữ liệu Lịch sử ---
  const fetchHistory = useCallback(async () => {
    if (!seriesRef.current) return;

    // SỬA LỖI TIMESTAMP: Đảm bảo cả 2 đều là seconds (10 chữ số)
    const now = Math.floor(Date.now() / 1000);
    const to = now;

    // Tính from
    const multiplier = resolution === "1D" ? 1440 : parseInt(resolution);
    const from = to - 1000 * 60 * multiplier;

    try {
      // SỬA ĐƯỜNG DẪN: Bỏ chữ '/public' ở đây đi
      // URL đúng: /api/orderly/tv/history?...
      const url = `${API_BASE}/tv/history?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}`;

      console.log("Fetching Chart URL:", url); // Debug

      const res = await fetch(url);
      const data = await res.json();

      // Kiểm tra data trả về
      if (data.s === "ok" && data.t && data.t.length > 0) {
        // ... (Logic map dữ liệu giữ nguyên như bài trước) ...
        const candles: CandlestickData[] = data.t.map(
          (time: number, index: number) => ({
            time: time as UTCTimestamp,
            open: Number(data.o[index]),
            high: Number(data.h[index]),
            low: Number(data.l[index]),
            close: Number(data.c[index]),
          })
        );

        // Loại bỏ trùng lặp và sort
        candles.sort((a, b) => (a.time as number) - (b.time as number));
        const uniqueCandles = candles.filter(
          (v, i, a) => i === 0 || v.time !== a[i - 1].time
        );

        seriesRef.current.setData(uniqueCandles);

        // Fit chart
        if (!ticker.mark_price) {
          chartRef.current?.timeScale().fitContent();
        }
      } else {
        console.warn("API Error or No Data:", data);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  }, [symbol, resolution]);

  // Gọi fetchHistory khi symbol hoặc resolution đổi
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // --- 3. Cập nhật Real-time (Ticker Update) ---
  useEffect(() => {
    if (!seriesRef.current || !ticker || !ticker.mark_price) return;

    // Lấy dữ liệu nến cuối cùng hiện có trên chart
    const data = seriesRef.current.data();

    if (data.length > 0) {
      const lastCandle = data[data.length - 1] as CandlestickData;

      // Update giá High/Low/Close của nến hiện tại
      // (Logic đơn giản: update nến đang chạy)
      const updatedCandle: CandlestickData = {
        ...lastCandle,
        close: ticker.mark_price,
        high: Math.max(lastCandle.high, ticker.mark_price),
        low: Math.min(lastCandle.low, ticker.mark_price),
      };

      seriesRef.current.update(updatedCandle);
    }
  }, [ticker]); // Chạy mỗi khi giá ticker thay đổi

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col h-full">
      {/* Chart Toolbar */}
      <div className="flex justify-between items-center p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-white text-sm">{symbol}</h3>
          <span className="text-xs text-gray-400">Mark Price</span>
        </div>

        {/* Timeframe Selector */}
        <div className="flex space-x-1 bg-gray-900 rounded p-1">
          {["1", "5", "15", "60", "1D"].map((tf) => (
            <button
              key={tf}
              onClick={() => setResolution(tf)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                resolution === tf
                  ? "bg-blue-600 text-white shadow"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              {tf === "1D" ? "1D" : `${tf}m`}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative flex-1 w-full min-h-[400px]">
        <div
          ref={chartContainerRef}
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
};

export default TradingChart;
