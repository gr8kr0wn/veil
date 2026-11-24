import { createZolanaClient, type ZolanaClient } from "@heliuslabs/zolana";

const API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY || process.env.HELIUS_API_KEY || "";

export function getHeliusRpcUrl(): string {
  if (!API_KEY) return "https://api.devnet.solana.com";
  return `https://devnet.helius-rpc.com/?api-key=${API_KEY}`;
}

export function hasHeliusKey(): boolean {
  return Boolean(API_KEY);
}

let clientPromise: Promise<ZolanaClient> | null = null;

export function getZolanaClient(): Promise<ZolanaClient> {
  if (!clientPromise) {
    clientPromise = createZolanaClient({
      solanaRpcUrl: getHeliusRpcUrl(),
    });
  }
  return clientPromise;
}
