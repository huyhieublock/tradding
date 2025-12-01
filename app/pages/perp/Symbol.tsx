import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { API } from "@orderly.network/types";
import { TradingPage } from "@orderly.network/trading";
import { updateSymbol } from "@/utils/storage";
import { formatSymbol, generatePageTitle } from "@/utils/utils";
import { useOrderlyConfig } from "@/utils/config";
import { getPageMeta } from "@/utils/seo";
import { renderSEOTags } from "@/utils/seo-tags";
import "./perp.styles.scss";

export default function PerpSymbol() {
  const params = useParams();
  const [symbol, setSymbol] = useState(params.symbol!);
  const config = useOrderlyConfig();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    updateSymbol(symbol);
  }, [symbol]);

  const onSymbolChange = useCallback(
    (data: API.Symbol) => {
      const symbol = data.symbol;
      setSymbol(symbol);

      const searchParamsString = searchParams.toString();
      const queryString = searchParamsString ? `?${searchParamsString}` : "";

      navigate(`/perp/${symbol}${queryString}`);
    },
    [navigate, searchParams]
  );

  const pageMeta = getPageMeta();
  const pageTitle = generatePageTitle(formatSymbol(params.symbol!));

  return (
    <>
      {renderSEOTags(pageMeta, pageTitle)}
      <div className="perp-container">
        <div className="perp-header">
          <div>
            <div className="perp-header-title">
              {formatSymbol(symbol)} Trading
            </div>
            <div className="perp-header-subtitle">
              Advanced perpetual futures trading
            </div>
          </div>
          <div className="perp-header-badge">
            Live Trading
          </div>
        </div>
        <div className="perp-trading-wrapper">
          <TradingPage
            symbol={symbol}
            onSymbolChange={onSymbolChange}
            tradingViewConfig={config.tradingPage.tradingViewConfig}
            sharePnLConfig={config.tradingPage.sharePnLConfig}
          />
        </div>
      </div>
    </>
  );
}
