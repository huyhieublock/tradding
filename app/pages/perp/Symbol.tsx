// src/pages/perp/Symbol.tsx
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { API } from "@orderly.network/types";
import { updateSymbol } from "@/utils/storage";
import { formatSymbol, generatePageTitle } from "@/utils/utils";
import { useOrderlyConfig } from "@/utils/config";
import { getPageMeta } from "@/utils/seo";
import { renderSEOTags } from "@/utils/seo-tags";
import OrderBookPanel from "./OrderBookPanel";
import MarketOverview from "./MarketOverview";
import OrderForm from "./OrderForm";
import UserPanel from "./UserPanel";
import TradingChart from "./TradingChart";

export default function PerpSymbol() {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Lấy symbol từ URL, mặc định là PERP_ETH_USDC nếu thiếu
  const symbol = params.symbol || "PERP_ETH_USDC";

  // Cập nhật Local Storage khi symbol thay đổi
  useEffect(() => {
    if (symbol) {
      updateSymbol(symbol);
    }
  }, [symbol]);

  // Logic SEO
  const pageMeta = getPageMeta();
  const pageTitle = generatePageTitle(formatSymbol(symbol));

  return (
    <>
      {renderSEOTags(pageMeta, pageTitle)}
      <div className="perp-container min-h-screen bg-[#0b0e11] text-white">
        <div className="p-4">
          {/* Market Overview - Truyền symbol vào */}
          <MarketOverview symbol={symbol} />

          {/* Main Grid Layout */}
          <div className="grid grid-cols-12 gap-4 mt-4">
            {/* Cột 1: Chart & Position (Chiếm 9/12) */}
            <div className="col-span-12 lg:col-span-9 flex flex-col gap-4">
              {/* QUAN TRỌNG: Thêm key={symbol} để ép Chart re-mount khi đổi coin */}
              <div className="h-[500px]">
                <TradingChart key={symbol} symbol={symbol} />
              </div>

              {/* User Panel (Vị thế, Lệnh chờ) */}
              <UserPanel symbol={symbol} />
            </div>

            {/* Cột 2: Orderbook & Form (Chiếm 3/12) */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
              {/* Order Book */}
              <OrderBookPanel symbol={symbol} />

              {/* Order Form */}
              <OrderForm symbol={symbol} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
