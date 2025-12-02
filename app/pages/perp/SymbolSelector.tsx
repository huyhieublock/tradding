import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
// FIX: Import MarketsType từ hooks thay vì types
import { useMarkets, MarketsType } from "@orderly.network/hooks";
import { ChevronDown, Search, Check } from "lucide-react";

export const SymbolSelector = () => {
  const navigate = useNavigate();
  const { symbol } = useParams<{ symbol: string }>();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Lấy danh sách tất cả market (ALL = 2)
  // useMarkets trả về: [danh_sách_coin, các_hàm_bổ_trợ]
  const [marketsData] = useMarkets(MarketsType.ALL);

  // 2. Lọc theo từ khóa tìm kiếm
  const filteredMarkets = useMemo(() => {
    if (!marketsData) return [];
    if (!searchTerm) return marketsData;
    return marketsData.filter((market) =>
      market.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [marketsData, searchTerm]);

  // 3. Tìm market hiện tại để hiển thị trên nút
  const currentMarket = useMemo(() => {
    return (marketsData || []).find((m) => m.symbol === symbol);
  }, [marketsData, symbol]);

  // Xử lý click ra ngoài để đóng menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSymbol = (newSymbol: string) => {
    // Chuyển hướng sang trang coin mới
    navigate(`/perp/${newSymbol}`);
    setIsOpen(false);
    setSearchTerm("");
  };

  // Helper: Format tên hiển thị (PERP_ETH_USDC -> ETH-PERP)
  const formatSymbolName = (rawSymbol: string) => {
    if (!rawSymbol) return "Select Market";
    const parts = rawSymbol.split("_");
    // Lấy phần giữa (ETH) làm tên chính
    return parts.length > 1 ? parts[1] : rawSymbol;
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* BUTTON CHÍNH */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-[32px] items-center gap-2 rounded-md bg-[#1b1d22] border border-[#2b303b] px-3 text-sm font-bold text-white hover:bg-[#25282e] transition-colors min-w-[140px] justify-between"
      >
        <div className="flex items-center gap-2">
          {/* Avatar Coin giả lập */}
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] text-white shadow-sm">
            {formatSymbolName(currentMarket?.symbol || symbol || "").substring(
              0,
              1
            )}
          </div>
          <span>{formatSymbolName(currentMarket?.symbol || symbol || "")}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute top-10 right-0 z-50 w-[320px] overflow-hidden rounded-lg border border-[#2b303b] bg-[#1b1d22] shadow-2xl ring-1 ring-black/50">
          {/* Search Input */}
          <div className="p-3 border-b border-[#2b303b]">
            <div className="relative group">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-500 group-focus-within:text-blue-500" />
              <input
                type="text"
                placeholder="Search symbol (e.g. BTC)..."
                className="w-full bg-[#0b0e11] text-white text-xs py-2.5 pl-9 pr-3 rounded border border-[#2b303b] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* List Header */}
          <div className="grid grid-cols-3 px-4 py-2 text-[10px] font-semibold text-gray-500 uppercase bg-[#15171b]">
            <span className="text-left">Symbol</span>
            <span className="text-right">Price</span>
            <span className="text-right">24h Change</span>
          </div>

          {/* Market Items List */}
          <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {filteredMarkets.length > 0 ? (
              filteredMarkets.map((market) => {
                const isUp = market.change >= 0;
                const isSelected = market.symbol === symbol;

                return (
                  <div
                    key={market.symbol}
                    onClick={() => handleSelectSymbol(market.symbol)}
                    className={`grid grid-cols-3 px-4 py-2.5 cursor-pointer transition-colors items-center border-b border-[#2b303b]/30 last:border-0 group
                        ${isSelected ? "bg-[#25282e]" : "hover:bg-[#1f2228]"}
                    `}
                  >
                    {/* Column 1: Name */}
                    <div className="text-left flex flex-col">
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        {formatSymbolName(market.symbol)}
                        {isSelected && (
                          <Check className="w-3 h-3 text-blue-500" />
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        PERP
                      </div>
                    </div>

                    {/* Column 2: Price */}
                    <div className="text-right text-xs font-mono font-medium text-gray-200">
                      {market["24h_close"]?.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }) || "--"}
                    </div>

                    {/* Column 3: Change */}
                    <div
                      className={`text-right text-xs font-mono font-medium ${
                        isUp ? "text-[#00E5AE]" : "text-[#FF4D4F]"
                      }`}
                    >
                      {isUp ? "+" : ""}
                      {(market.change * 100).toFixed(2)}%
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
                <Search className="w-6 h-6 opacity-20" />
                <span>No markets found</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
