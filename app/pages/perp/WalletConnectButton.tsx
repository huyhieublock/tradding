import { useState } from "react";
import { useWalletConnector, useAccount } from "@orderly.network/hooks";
import { AccountStatusEnum } from "@orderly.network/types";
import { Loader2 } from "lucide-react";

export const WalletConnectButton = () => {
  const { connect, disconnect, connecting, wallet } = useWalletConnector();
  const { state, createAccount } = useAccount();
  const [showMenu, setShowMenu] = useState(false);

  // Format địa chỉ ví: 0x12...3456
  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const handleConnect = async () => {
    try {
      // 1. Nếu chưa kết nối ví L1 (Metamask/Rabby...)
      if (!wallet) {
        console.log("🖱️ Clicking Connect...");
        await connect();
        return;
      }

      // 2. Nếu đã nối ví nhưng chưa Sign (Enable Trading)
      if (state.status < AccountStatusEnum.EnableTrading) {
        await createAccount();
      }
    } catch (error) {
      console.error("Connect error:", error);
    }
  };

  const handleDisconnect = async () => {
    if (wallet) {
      await disconnect({ label: wallet.label });
      setShowMenu(false);
    }
  };

  // --- TRẠNG THÁI LOADING ---
  if (connecting || state.status === AccountStatusEnum.NotSignedIn) {
    return (
      <button
        disabled
        className="h-[32px] px-4 rounded-md font-medium text-sm text-white bg-slate-700 cursor-wait flex items-center gap-2"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Processing...</span>
      </button>
    );
  }

  // --- TRẠNG THÁI ĐÃ KẾT NỐI (HIỆN ĐỊA CHỈ) ---
  if (wallet && state.status >= AccountStatusEnum.EnableTrading) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="h-[32px] pl-2 pr-3 rounded-md flex items-center gap-2 bg-[#1b1d22] hover:bg-[#25282e] border border-slate-700 transition-colors text-white text-sm font-medium"
        >
          {/* Logo ví (nếu có) hoặc icon mặc định */}
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#00E5AE] to-[#006CDD] flex items-center justify-center">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          {formatAddress(wallet.accounts[0]?.address)}
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-0 top-10 w-48 bg-[#1b1d22] border border-slate-700 rounded-md shadow-xl z-50 overflow-hidden">
            <button
              onClick={handleDisconnect}
              className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- TRẠNG THÁI CHƯA KẾT NỐI (NÚT GRADIENT) ---
  // Kiểm tra: Nếu đã nối ví nhưng chưa Sign -> Hiện "Enable Trading"
  const isWalletConnectedButNotSigned =
    wallet && state.status < AccountStatusEnum.EnableTrading;

  return (
    <button
      onClick={handleConnect}
      className={`
        h-[32px] px-4 rounded-[4px] font-semibold text-sm text-[#0b0e11] 
        transition-all hover:opacity-90 active:scale-95
        bg-gradient-to-r from-[#00E5AE] to-[#006CDD]
        ${isWalletConnectedButNotSigned ? "animate-pulse" : ""}
      `}
    >
      {isWalletConnectedButNotSigned ? "Enable Trading" : "Connect wallet"}
    </button>
  );
};
