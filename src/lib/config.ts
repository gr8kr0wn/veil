export type Network = "mainnet" | "devnet";

// Defaults to mainnet. Set NEXT_PUBLIC_SOLANA_NETWORK=devnet to develop against devnet.
export const SOLANA_NETWORK: Network = process.env.NEXT_PUBLIC_SOLANA_NETWORK === "devnet" ? "devnet" : "mainnet";
export const CLUSTER = SOLANA_NETWORK === "mainnet" ? ("mainnet-beta" as const) : ("devnet" as const);
export const NETWORK_LABEL = SOLANA_NETWORK === "mainnet" ? "Mainnet" : "Devnet";
export const HELIUS_HOST = `${SOLANA_NETWORK}.helius-rpc.com`;
/** Same-origin path of the server-side Helius proxy. The API key never reaches the browser. */
export const PROXY_PATH = "/api/helius";
/** Websocket for confirmations (a keyed Helius ws URL would leak the key). */
export const PUBLIC_WS_URL = `wss://api.${CLUSTER}.solana.com`;
