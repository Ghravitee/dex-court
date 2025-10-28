// Updated config.ts
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import {
  mainnet,
  sepolia,
  polygon,
  optimism,
  arbitrum,
  base,
  // bscTestnet,
  // bsc
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
const alchemyKey = import.meta.env.VITE_ETH_RPC_URL!;
const Sepolia_AlchemyKey = import.meta.env.VITE_SEPOLIA_RPC_URL!;
// const bsc_AlchemyKey = import.meta.env.VITE_BSC_RPC_URL!;
// const bscTestnet_AlchemyKey = import.meta.env.VITE_BSC_TESTNET_RPC_URL! || import.meta.env.VITE_BSC_TESTNET_RPC_URL2!; // Fallback to second key if first is not set

// Define all supported chains
export const ALL_CHAINS = [
  mainnet,
  sepolia,
  polygon,
  optimism,
  arbitrum,
  base,
  // bscTestnet,
  // bsc
];

export const config = getDefaultConfig({
  appName: "Abyss App",
  projectId,
  chains: [mainnet, sepolia,
    //  bscTestnet, bsc
  ], // Support all chains
  ssr: true,
  transports: {
    [mainnet.id]: http(alchemyKey),
    [sepolia.id]: http(Sepolia_AlchemyKey),
    // [bscTestnet.id]: http(bscTestnet_AlchemyKey),
    // [bsc.id]: http(bsc_AlchemyKey),
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
