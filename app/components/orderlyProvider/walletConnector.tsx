import { ReactNode, useMemo } from "react"; // Thêm useMemo
import { WalletConnectorProvider } from "@orderly.network/wallet-connector";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import type { NetworkId } from "@orderly.network/types";
import {
  getEvmInitialConfig,
  getSolanaWallets,
} from "../../utils/walletConfig";
import { getRuntimeConfigBoolean } from "@/utils/runtime-config";

interface WalletConnectorProps {
  children: ReactNode;
  networkId: NetworkId;
}

const WalletConnector = ({ children, networkId }: WalletConnectorProps) => {
  const disableEVMWallets = getRuntimeConfigBoolean("VITE_DISABLE_EVM_WALLETS");
  const disableSolanaWallets = getRuntimeConfigBoolean(
    "VITE_DISABLE_SOLANA_WALLETS"
  );

  // FIX QUAN TRỌNG: Dùng useMemo để cache object config
  // Ngăn chặn việc khởi tạo lại Onboard mỗi lần component re-render
  const evmInitial = useMemo(() => {
    if (disableEVMWallets) return undefined;
    return getEvmInitialConfig(networkId);
  }, [networkId, disableEVMWallets]);

  const solanaInitial = useMemo(() => {
    if (disableSolanaWallets) return undefined;
    return {
      network:
        networkId === "mainnet"
          ? WalletAdapterNetwork.Mainnet
          : WalletAdapterNetwork.Devnet,
      wallets: getSolanaWallets(networkId),
    };
  }, [networkId, disableSolanaWallets]);

  console.log(evmInitial);

  return (
    <WalletConnectorProvider
      solanaInitial={solanaInitial}
      evmInitial={evmInitial}
    >
      {children}
    </WalletConnectorProvider>
  );
};

export default WalletConnector;
