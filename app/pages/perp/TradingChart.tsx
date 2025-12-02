import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  UTCTimestamp,
  CandlestickData,
} from "lightweight-charts";
import { useTickerStream } from "@orderly.network/hooks";

interface TradingChartProps {
  symbol: string;
}

// Đường dẫn này sẽ hoạt động cả ở Local (qua Vite Proxy) và Vercel (qua Rewrites)
const API_BASE = "/api/orderly";

const TradingChart: React.FC<TradingChartProps> = ({ symbol }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // Hook lấy giá realtime
  const ticker = useTickerStream(symbol);

  const [resolution, setResolution] = useState<string>("15");

  // 1. Khởi tạo Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#111827" }, // gray-900
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "#374151" },
        horzLines: { color: "#374151" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 450,
      autoSize: true,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        fixRightEdge: true,
      },
    });

    const newSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = newSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // 2. Fetch History Data
  const fetchHistory = useCallback(async () => {
    if (!seriesRef.current) return;

    const now = Math.floor(Date.now() / 1000);
    const to = now;
    const multiplier = resolution === "1D" ? 1440 : parseInt(resolution);
    const from = to - 1000 * 60 * multiplier;

    try {
      const url = `${API_BASE}/tv/history?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}`;
      // console.log("Fetching Chart:", url);

      const res = await fetch(url);
      const data = await res.json();

      if (data.s === "ok" && data.t && data.t.length > 0) {
        const candles: CandlestickData[] = data.t.map(
          (time: number, index: number) => ({
            time: time as UTCTimestamp,
            open: Number(data.o[index]),
            high: Number(data.h[index]),
            low: Number(data.l[index]),
            close: Number(data.c[index]),
          })
        );

        candles.sort((a, b) => (a.time as number) - (b.time as number));
        const uniqueCandles = candles.filter(
          (v, i, a) => i === 0 || v.time !== a[i - 1].time
        );

        seriesRef.current.setData(uniqueCandles);

        // --- SỬA LỖI TẠI ĐÂY ---
        // Dùng optional chaining (?.) để kiểm tra ticker có tồn tại không trước khi đọc mark_price
        if (!ticker?.mark_price) {
          chartRef.current?.timeScale().fitContent();
        }
      }
    } catch (error) {
      console.error("Chart fetch error:", error);
    }
  }, [symbol, resolution]); // Không thêm 'ticker' vào dependency để tránh re-fetch liên tục

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // 3. Realtime Update
  useEffect(() => {
    if (!seriesRef.current || !ticker || !ticker.mark_price) return;

    const data = seriesRef.current.data();
    if (data.length > 0) {
      const lastCandle = data[data.length - 1] as CandlestickData;

      const updatedCandle: CandlestickData = {
        ...lastCandle,
        close: ticker.mark_price,
        high: Math.max(lastCandle.high, ticker.mark_price),
        low: Math.min(lastCandle.low, ticker.mark_price),
      };

      seriesRef.current.update(updatedCandle);
    }
  }, [ticker]);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col h-full shadow-lg">
      <div className="flex justify-between items-center p-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-white">{symbol}</h3>
          {/* Cũng cần check null ở đây khi render */}
          {ticker?.mark_price && (
            <span
              className={`text-sm font-mono ${
                (ticker?.["24h_change"] || 0) >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {ticker.mark_price.toFixed(2)}
            </span>
          )}
        </div>
        <div className="flex space-x-1 bg-gray-900 rounded p-1">
          {["1", "5", "15", "60", "1D"].map((tf) => (
            <button
              key={tf}
              onClick={() => setResolution(tf)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                resolution === tf
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tf === "1D" ? "1D" : `${tf}m`}
            </button>
          ))}
        </div>
      </div>
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
