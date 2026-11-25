import type { SprClient } from "@heliuslabs/spr/client";
import type { PublicKey, Transaction as LegacyTransaction, VersionedTransaction } from "@solana/web3.js";
import { PROXY_PATH, PUBLIC_WS_URL, SOLANA_NETWORK } from "./config";

/* ------------------------------------------------------------------ */
/* Client                                                              */
/* ------------------------------------------------------------------ */

let clientPromise: Promise<SprClient> | null = null;

async function load(): Promise<SprClient> {
  // Dynamic import: the WASM hasher only loads when someone actually syncs.
  const [{ createSprClient }, { SignedTeePolicy }] = await Promise.all([
    import("@heliuslabs/spr"),
    import("@heliuslabs/spr/client"),
  ]);
  const base = `${window.location.origin}${PROXY_PATH}`;
  return createSprClient({
    solanaRpcUrl: base,
    solanaRpcSubscriptionsUrl: PUBLIC_WS_URL,
    // Helius serves the indexer and prover from the same host under /v1/spr.
    indexerUrl: `${base}/v1/spr`,
    proverUrl: `${base}/v1/spr`,
    proverTee: SignedTeePolicy.forNetwork(SOLANA_NETWORK),
    commitment: "confirmed",
  });
}

export function getSprClient(): Promise<SprClient> {
  if (typeof window === "undefined") return Promise.reject(new Error("The SPR client runs in the browser"));
  clientPromise ??= load().catch((e) => {
    clientPromise = null; // allow retry
    throw e;
  });
  return clientPromise;
}

/** Builds the client and proves the Helius RPC answers. Returns the current slot. */
export async function checkHelius(): Promise<number> {
  const client = await getSprClient();
  const slot = await client.solanaRpc.getSlot().send();
  return Number(slot);
}

/* ------------------------------------------------------------------ */
/* Money helpers (SOL only)                                            */
/* ------------------------------------------------------------------ */

export const LAMPORTS_PER_SOL = 1_000_000_000n;

/** "1.25" -> 1250000000n. Throws on anything that isn't a positive amount. */
export function solToLamports(input: string): bigint {
  const s = input.trim();
  if (!/^\d*\.?\d{0,9}$/.test(s) || s === "" || s === ".") throw new Error("Enter a valid amount");
  const [whole = "0", frac = ""] = s.split(".");
  const lamports = BigInt(whole || "0") * LAMPORTS_PER_SOL + BigInt(frac.padEnd(9, "0") || "0");
  if (lamports <= 0n) throw new Error("Amount must be more than 0");
  return lamports;
}

export function formatSol(lamports: bigint, maxDecimals = 4): string {
  const whole = lamports / LAMPORTS_PER_SOL;
  const frac = (lamports % LAMPORTS_PER_SOL).toString().padStart(9, "0").slice(0, maxDecimals).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : `${whole}`;
}

/* ------------------------------------------------------------------ */
/* Session: keys come from the user's wallet, nothing is stored        */
/* ------------------------------------------------------------------ */

/** The slice of the wallet-adapter API this module needs. */
export interface WalletLike {
  publicKey: PublicKey;
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
  signTransaction?: <T extends LegacyTransaction | VersionedTransaction>(tx: T) => Promise<T>;
}

export interface HistoryItem {
  id: string;
  kind: "deposit" | "privateTransfer" | "ringEntry" | "publicWithdrawal" | "split" | "merge";
  direction: "inbound" | "outbound" | "selfTransfer";
  amount: bigint;
  signature: string;
}

export interface Snapshot {
  balance: bigint;
  history: HistoryItem[];
}

export interface Payment {
  recipient: string;
  amount: bigint;
}

type Sdk = typeof import("@heliuslabs/spr");
type Kit = typeof import("@solana/kit");

interface Session {
  owner: string;
  signer: WalletLike;
  client: SprClient;
  sdk: Sdk;
  kit: Kit;
  wallet: InstanceType<Sdk["Wallet"]>;
  keys: ReturnType<Sdk["LocalKeys"]["fromDerivationSeed"]>;
}

let session: Session | null = null;

export function isUnlocked(owner?: string): boolean {
  return session !== null && (owner === undefined || session.owner === owner);
}

export function lock(): void {
  session?.keys.destroy();
  session = null;
}

function need(): Session {
  if (!session) throw new Error("Unlock your treasury first");
  return session;
}

function snapshot(s: Session): Snapshot {
  const { sdk, wallet } = s;
  return {
    balance: wallet.balance(sdk.SOL_MINT).amount,
    history: sdk
      .getPrivateTransactions(wallet)
      .map((t) => ({
        id: `${t.id.signature}:${t.id.index}`,
        kind: t.kind,
        direction: t.direction,
        amount: t.amount,
        signature: String(t.id.signature),
      }))
      .reverse(),
  };
}

async function syncNow(s: Session, requireSlot?: bigint): Promise<Snapshot> {
  await s.sdk.syncWallet({
    client: s.client,
    wallet: s.wallet,
    keys: s.keys,
    config: requireSlot === undefined ? undefined : { requireSlot },
  });
  return snapshot(s);
}

/**
 * Derives the private keys from one wallet signature (no seed phrase, nothing
 * stored) and syncs. The same wallet always derives the same keys.
 */
export async function unlock(signer: WalletLike): Promise<Snapshot> {
  if (!signer.signMessage) throw new Error("This wallet can't sign messages. Try Phantom or Solflare.");
  const owner = signer.publicKey.toBase58();
  if (session && session.owner === owner) return syncNow(session);
  lock();

  const [client, sdk, kit, { ed25519DerivationMessage }] = await Promise.all([
    getSprClient(),
    import("@heliuslabs/spr"),
    import("@solana/kit"),
    import("@heliuslabs/spr/keypair"),
  ]);

  const message = ed25519DerivationMessage(signer.publicKey.toBytes() as Parameters<typeof ed25519DerivationMessage>[0]);
  const derivationSeed = await signer.signMessage(message);
  const keys = sdk.LocalKeys.fromDerivationSeed(
    { solanaPublicKey: kit.address(owner), derivationSeed },
    client.proofService,
  );
  const wallet = new sdk.Wallet({ identity: keys.address() });

  const next: Session = { owner, signer, client, sdk, kit, wallet, keys };
  const snap = await syncNow(next);
  session = next;
  return snap;
}

/**
 * Asks the wallet app to sign the raw v1 transaction bytes. web3.js can read a
 * v1 transaction but cannot serialize one, so wallet adapters get a thin object
 * that hands over the exact wire bytes, and we read the signature back out.
 */
async function signWithWallet(s: Session, tx: unknown) {
  const { kit, signer, owner } = s;
  if (!signer.signTransaction) throw new Error("This wallet can't sign transactions");

  const wire = new Uint8Array(kit.getTransactionEncoder().encode(tx as never));
  const handoff = {
    version: 1,
    signatures: [new Uint8Array(64)],
    serialize: () => wire,
  } as unknown as VersionedTransaction;

  const signed = (await signer.signTransaction(handoff)) as unknown as {
    signatures?: Uint8Array[];
    serialize?: () => Uint8Array;
  };

  let sig: Uint8Array | undefined = signed.signatures?.[0];
  if (!sig || sig.every((b) => b === 0)) {
    // Some wallets return serialized bytes through serialize() instead.
    try {
      const back = kit.getTransactionDecoder().decode(signed.serialize!());
      sig = back.signatures[kit.address(owner)] ?? undefined;
    } catch {
      sig = undefined;
    }
  }
  if (!sig || sig.length !== 64 || sig.every((b) => b === 0)) {
    throw new Error("Your wallet couldn't sign this transaction. Try Phantom or Solflare, updated.");
  }

  const original = kit.getTransactionDecoder().decode(wire);
  return { ...original, signatures: { ...original.signatures, [kit.address(owner)]: sig } };
}

/** Signs with the wallet app and sends. Returns the landing slot once indexed. */
async function submit(s: Session, tx: unknown): Promise<bigint> {
  const { kit, client } = s;
  const signedTx = await signWithWallet(s, tx);

  const sendAndConfirm = kit.sendAndConfirmTransactionFactory({
    rpc: client.solanaRpc,
    rpcSubscriptions: client.solanaRpcSubscriptions,
  } as never) as unknown as (t: unknown, c: { commitment: "confirmed" }) => Promise<void>;
  await sendAndConfirm(signedTx, { commitment: "confirmed" });

  const signature = kit.getSignatureFromTransaction(signedTx as never);
  return client.confirmTransaction(signature);
}

function feePayer(s: Session) {
  return s.kit.address(s.owner);
}

/** Lets other Veil users find and pay you. Safe to call repeatedly. */
export async function register(): Promise<Snapshot> {
  const s = need();
  const tx = await s.sdk.buildRegistrationTransaction({
    client: s.client,
    owner: feePayer(s),
    address: s.keys.address(),
  });
  if (tx === undefined) return snapshot(s); // already registered
  const slot = await submit(s, tx);
  return syncNow(s, slot);
}

export async function refresh(): Promise<Snapshot> {
  return syncNow(need());
}

/** Public SOL -> private balance. */
export async function deposit(amount: bigint): Promise<Snapshot> {
  const s = need();
  const tx = await s.sdk.buildDepositTransaction({
    client: s.client,
    feePayer: feePayer(s),
    recipient: s.keys.address(),
    amount,
  });
  return syncNow(s, await submit(s, tx));
}

/** Private transfer to another registered Veil user. */
export async function send(recipient: string, amount: bigint): Promise<Snapshot> {
  const s = need();
  const tx = await s.sdk.buildTransferTransaction({
    client: s.client,
    wallet: s.wallet,
    keys: s.keys,
    feePayer: feePayer(s),
    recipient: s.kit.address(recipient.trim()),
    amount,
  });
  return syncNow(s, await submit(s, tx));
}

/** Up to 15 private payments in one transaction (batch / payroll). */
export async function sendMany(payments: Payment[]): Promise<Snapshot> {
  const s = need();
  if (payments.length === 0) throw new Error("Add at least one recipient");
  if (payments.length > 15) throw new Error("Up to 15 recipients at a time");
  const tx = await s.sdk.buildMultiTransferTransaction({
    client: s.client,
    wallet: s.wallet,
    keys: s.keys,
    feePayer: feePayer(s),
    payments: payments.map((p) => ({ recipient: s.kit.address(p.recipient.trim()), amount: p.amount })),
  });
  return syncNow(s, await submit(s, tx));
}

/** Private -> public. The destination and amount are visible on-chain. */
export async function withdraw(recipient: string, amount: bigint): Promise<Snapshot> {
  const s = need();
  const tx = await s.sdk.buildWithdrawalTransaction({
    client: s.client,
    wallet: s.wallet,
    keys: s.keys,
    feePayer: feePayer(s),
    recipient: s.kit.address(recipient.trim()),
    amount,
  });
  return syncNow(s, await submit(s, tx));
}

/** Turns SDK and wallet errors into one short, human sentence. */
export function friendlyError(e: unknown): string {
  const code = typeof e === "object" && e !== null && "code" in e ? String((e as { code: unknown }).code) : "";
  const msg = e instanceof Error ? e.message : String(e);
  if (/User rejected|rejected the request|declined/i.test(msg)) return "Cancelled in your wallet";
  if (code.includes("RECIPIENT_NOT_REGISTERED")) return "They haven't set up Veil yet";
  if (code.includes("INSUFFICIENT") || /insufficient/i.test(msg)) return "Not enough private balance";
  if (code.includes("ATTESTATION") || /attest|policy/i.test(msg)) return "Couldn't verify the secure prover. Try again shortly.";
  if (/not a valid|invalid address|Invalid base58|address/i.test(msg) && /valid|invalid/i.test(msg)) return "That address doesn't look right";
  return msg.length > 140 ? `${msg.slice(0, 137)}…` : msg;
}
