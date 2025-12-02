// src/utils/walletConfig.ts
import { type NetworkId } from "@orderly.network/types";
import { getRuntimeConfig } from "./runtime-config";

// IMPORT THẲNG TỪ LIBRARY (Không qua biến trung gian)
import injectedModule from "@web3-onboard/injected-wallets";
import walletConnectModule from "@web3-onboard/walletconnect";

// Hàm xử lý import an toàn cho Vite
const getSafeModule = (mod: any) => {
  // Nếu là function thì trả về luôn
  if (typeof mod === "function") return mod;
  // Nếu nằm trong default và là function
  if (mod && typeof mod.default === "function") return mod.default;
  // Fallback
  return mod;
};

// --- Config Chain Cứng ---
const CHAINS = {
  testnet: [
    {
      id: "0x66eee",
      token: "ETH",
      label: "Arbitrum Sepolia",
      rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    },
  ],
  mainnet: [
    {
      id: "0xa4b1",
      token: "ETH",
      label: "Arbitrum One",
      rpcUrl: "https://arb1.arbitrum.io/rpc",
    },
  ],
};

export const getEvmInitialConfig = (networkId: NetworkId) => {
  const wallets = [];

  try {
    // 1. Injected Wallet (Metamask...)
    const injectedFn = getSafeModule(injectedModule);

    // Gọi hàm khởi tạo ngay lập tức để lấy object WalletModule
    // Thay vì push function vào, ta push KẾT QUẢ của function đó
    const injectedWallet = injectedFn();

    if (injectedWallet) {
      wallets.push(injectedWallet);
    }

    // 2. WalletConnect
    const projectId = getRuntimeConfig("VITE_WALLETCONNECT_PROJECT_ID");
    if (projectId) {
      const wcFn = getSafeModule(walletConnectModule);
      const wcWallet = wcFn({
        projectId,
        qrModalOptions: { themeMode: "dark" },
        dappUrl: window.location.origin,
      });
      if (wcWallet) wallets.push(wcWallet);
    }
  } catch (err) {
    console.error("Wallet Init Failed:", err);
  }

  // Log kiểm tra cấu trúc ví
  // Bạn sẽ thấy mảng chứa Object { label: 'Injected', ... } chứ không phải Function
  console.log("🛠️ Wallets Ready:", wallets);

  return {
    options: {
      // Bọc trong options theo đúng type
      wallets,
      chains: networkId === "testnet" ? CHAINS.testnet : CHAINS.mainnet,
      appMetadata: {
        name: "Orderly DEX",
        description: "Powered by Orderly",
      },
      connect: {
        autoConnectLastWallet: true,
      },
    },
  };
};

// --- Mock ---
export const getSolanaWallets = () => [];
export const getSolanaConfig = () => ({});
export const getEvmConnectors = () => [];
