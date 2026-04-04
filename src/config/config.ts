// Updated config.ts
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import {
  mainnet,
  sepolia,
  // polygon,
  // optimism,
  // arbitrum,
  base,
  baseSepolia,
  bsc,
  bscTestnet,
} from "wagmi/chains";
import {
  metaMaskWallet,
  phantomWallet,
  rainbowWallet,
  trustWallet,
  walletConnectWallet,
  injectedWallet,
} from "@rainbow-me/rainbowkit/wallets";

const projectId = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID!;
// const alchemyKey =
//   import.meta.env.VITE_ETH_RPC_URL! ||
//   `https://lb.nodies.app/v2/ethereum?apikey=dd97685f-5501-46ee-8dc7-18c09b5eaf46`;
// const Sepolia_AlchemyKey =
//   import.meta.env.VITE_SEPOLIA_RPC_URL! ||
//   `https://lb.nodies.app/v2/ethereum-sepolia?apikey=dd97685f-5501-46ee-8dc7-18c09b5eaf46`;
// // const bsc_AlchemyKey = import.meta.env.VITE_BSC_RPC_URL!;
// const bsc_url =
//   import.meta.env.VITE_BSC_RPC_URL! || "https://bsc-dataseed.binance.org/";
// const base_url =
//   import.meta.env.VITE_BASE_RPC_URL! ||
//   "https://base-mainnet.public.blastapi.io";
// const baseSepolia_url =
//   import.meta.env.VITE_BASE_SEPOLIA_RPC_URL! ||
//   "https://sepolia.base.org";
// const bscTestnet_url = import.meta.env.VITE_BSC_TESTNET_RPC_URL! || import.meta.env.VITE_BSC_TESTNET_RPC_URL2!; // Fallback to second key if first is not set

// Define all supported chains
export const ALL_CHAINS = [
  mainnet,
  sepolia,
  // polygon,
  // optimism,
  // arbitrum,
  base,
  bscTestnet,
  baseSepolia,
  bsc,
];

export const config = getDefaultConfig({
  appName: "Abyss App",
  projectId,
  chains: [
    mainnet,
    sepolia,
    bsc,
    bscTestnet,
    base,
    baseSepolia,
  ], // Support all chains
  ssr: true,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    // [bsc.id]: http(bsc_AlchemyKey),
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  wallets: [
    {
      groupName: "Recommended",
      wallets: [
        injectedWallet,
        phantomWallet,
        metaMaskWallet,
        trustWallet,
        rainbowWallet,
        walletConnectWallet,
      ],
    },
  ],
});

// Environment detection
export const isDevEnvironment = import.meta.env.DEV;
