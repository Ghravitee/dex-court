// WalletApp.tsx
import type { FC } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { config } from "../config/config";
import App from "../App";

const queryClient = new QueryClient();

const WalletApp: FC = () => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#06b6d4", // cyan-500
            accentColorForeground: "white",
            borderRadius: "large",
            overlayBlur: "large",
          })}
          modalSize="wide"
        >
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default WalletApp;
