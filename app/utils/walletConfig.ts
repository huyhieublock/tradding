// src/utils/walletConfig.ts
import { CreateConnectorFn } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import {
  Adapter,
  WalletError,
  WalletAdapterNetwork,
  WalletNotReadyError,
} from "@solana/wallet-adapter-base";
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import {
  createDefaultAddressSelector,
  createDefaultAuthorizationResultCache,
  SolanaMobileWalletAdapter,
} from "@solana-mobile/wallet-adapter-mobile";
// XÓA IMPORT CÁC BIẾN HEX Ở ĐÂY ĐỂ TRÁNH LỖI UNDEFINED
import { type NetworkId } from "@orderly.network/types";
import injectedOnboard from "@web3-onboard/injected-wallets";
import { getRuntimeConfig } from "./runtime-config";
import walletConnectOnboard from "@web3-onboard/walletconnect";
import binanceWallet from "@binance/w3w-blocknative-connector";

// --- Phần Wagmi (Giữ nguyên) ---
export const getEvmConnectors = (): CreateConnectorFn[] => {
  const walletConnectProjectId = getRuntimeConfig(
    "VITE_WALLETCONNECT_PROJECT_ID"
  );
  const isBrowser = typeof window !== "undefined";

  const connectors: CreateConnectorFn[] = [injected()];

  if (walletConnectProjectId && isBrowser) {
    connectors.push(
      walletConnect({
        projectId: walletConnectProjectId,
        showQrModal: true,
        metadata: {
          name: getRuntimeConfig("VITE_APP_NAME") || "Orderly App",
          description:
            getRuntimeConfig("VITE_APP_DESCRIPTION") || "Orderly Application",
          url: window.location.origin,
          icons: [`${window.location.origin}/favicon.webp`],
        },
      })
    );
  }

  return connectors;
};

// --- Phần Solana (Giữ nguyên) ---
export const getSolanaWallets = (networkId: NetworkId) => {
  const isBrowser = typeof window !== "undefined";

  if (!isBrowser) {
    return [];
  }

  return [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new LedgerWalletAdapter(),
    new SolanaMobileWalletAdapter({
      addressSelector: createDefaultAddressSelector(),
      appIdentity: {
        uri: `${location.protocol}//${location.host}`,
      },
      authorizationResultCache: createDefaultAuthorizationResultCache(),
      chain:
        networkId === "mainnet"
          ? WalletAdapterNetwork.Mainnet
          : WalletAdapterNetwork.Devnet,
      onWalletNotFound: (adapter: SolanaMobileWalletAdapter) => {
        console.log("-- mobile wallet adapter", adapter);
        return Promise.reject(new WalletNotReadyError("wallet not ready"));
      },
    }),
  ];
};

export const getSolanaConfig = (networkId: NetworkId) => {
  return {
    wallets: getSolanaWallets(networkId),
    onError: (error: WalletError, adapter?: Adapter) => {
      console.log("-- error", error, adapter);
    },
  };
};

// --- Phần Web3Onboard ---

export const getOnboardEvmWallets = () => {
  const walletConnectProjectId = getRuntimeConfig(
    "VITE_WALLETCONNECT_PROJECT_ID"
  );
  const isBrowser = typeof window !== "undefined";

  if (!isBrowser) {
    return [];
  }

  const wallets = [injectedOnboard()];

  if (walletConnectProjectId) {
    wallets.push(
      binanceWallet({ options: { lng: "en" } }),
      walletConnectOnboard({
        projectId: walletConnectProjectId,
        qrModalOptions: {
          themeMode: "dark",
        },
        dappUrl: window.location.origin,
      })
    );
  }

  return wallets;
};

export const getEvmInitialConfig = (networkId: NetworkId) => {
  const wallets = getOnboardEvmWallets();

  // FIX LỖI TẠI ĐÂY: Dùng chuỗi cứng thay vì biến import
  const chains =
    networkId === "testnet"
      ? [
          {
            id: "0x66eee", // Hardcode: Arbitrum Sepolia
            token: "ETH",
            label: "Arbitrum Sepolia",
            rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
          },
        ]
      : [
          {
            id: "0xa4b1", // Hardcode: Arbitrum One
            token: "ETH",
            label: "Arbitrum One",
            rpcUrl: "https://arb1.arbitrum.io/rpc",
          },
        ];

  // Trả về cấu trúc phẳng
  return {
    wallets,
    chains,
    appMetadata: {
      name: getRuntimeConfig("VITE_ORDERLY_BROKER_NAME") || "Orderly DEX",
      description:
        getRuntimeConfig("VITE_ORDERLY_BROKER_NAME") ||
        "DEX powered by Orderly",
    },
    connect: {
      autoConnectLastWallet: true,
    },
  };
};
