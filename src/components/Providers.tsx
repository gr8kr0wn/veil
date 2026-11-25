"use client";

import { createContext, useContext, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { CLUSTER, PROXY_PATH, PUBLIC_WS_URL } from "@/lib/config";

import "@solana/wallet-adapter-react-ui/styles.css";

type AppConfig = { heliusEnabled: boolean };
const AppConfigContext = createContext<AppConfig>({ heliusEnabled: false });
export const useAppConfig = () => useContext(AppConfigContext);

export default function Providers({
  children,
  heliusEnabled,
}: {
  children: React.ReactNode;
  heliusEnabled: boolean;
}) {
  // All RPC goes through our server proxy when Helius is configured (key stays server-side).
  // Falls back to the public cluster so the app still works without a key.
  const endpoint = useMemo(
    () =>
      heliusEnabled && typeof window !== "undefined"
        ? `${window.location.origin}${PROXY_PATH}`
        : clusterApiUrl(CLUSTER),
    [heliusEnabled],
  );
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);
  const config = useMemo(() => ({ commitment: "confirmed" as const, wsEndpoint: PUBLIC_WS_URL }), []);
  const appConfig = useMemo(() => ({ heliusEnabled }), [heliusEnabled]);

  return (
    <AppConfigContext.Provider value={appConfig}>
      <ConnectionProvider endpoint={endpoint} config={config}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </AppConfigContext.Provider>
  );
}
