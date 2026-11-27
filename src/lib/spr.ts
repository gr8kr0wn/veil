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
  mode: UnlockMode;
}

/** "standard" signs the SDK's own message. "text" signs readable text, for wallets that block or alter it. */
export type UnlockMode = "standard" | "text";

let session: Session | null = null;

/** Warms the SDK and Helius client so Unlock feels instant. Safe to call anytime. */
export function preload(): void {
  if (typeof window === "undefined") return;
  void getSprClient().catch(() => undefined);
  void import("@heliuslabs/spr").catch(() => undefined);
  void import("@solana/kit").catch(() => undefined);
}

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
 * Some wallets re-encode the message before signing, so the signature is valid
 * but over different bytes. Work out which variant they signed so the error is
 * specific and we can support that wallet properly.
 */
async function diagnoseSignature(kit: Kit, owner: string, sig: Uint8Array, message: Uint8Array): Promise<string> {
  if (sig.length !== 64) return `signature-length-${sig.length}`;
  try {
    const key = await kit.getPublicKeyFromAddress(kit.address(owner));
    const enc = new TextEncoder();
    const asText = new TextDecoder().decode(message);
    const b64 = btoa(String.fromCharCode(...message));
    const hex = Array.from(message, (b) => b.toString(16).padStart(2, "0")).join("");
    const variants: Array<[string, Uint8Array]> = [
      ["utf8-roundtrip", enc.encode(asText)],
      ["base64-text", enc.encode(b64)],
      ["hex-text", enc.encode(hex)],
      ["payload-only", enc.encode("TSPP/derive/v1")],
    ];
    for (const [name, bytes] of variants) {
      if (await kit.verifySignature(key, kit.signatureBytes(sig), bytes as never)) return name;
    }
  } catch {
    /* WebCrypto Ed25519 may be unavailable; fall through */
  }
  return "other";
}

/**
 * Derives the private keys from one wallet signature (no seed phrase, nothing
 * stored) and syncs. The same wallet always derives the same keys.
 */
export async function unlock(signer: WalletLike): Promise<Snapshot> {
  const owner = signer.publicKey.toBase58();
  if (session && session.owner === owner) return syncNow(session);
  // A wallet that once needed the readable-text unlock keeps using it, so the
  // same wallet always opens the same vault.
  if (savedMode(owner) === "text") return unlockText(signer);
  try {
    return await unlockStandard(signer);
  } catch (e) {
    if (!walletBlocksStandard(e)) throw e;
    return unlockText(signer);
  }
}

function modeKey(owner: string): string {
  return `veil:unlock-mode:${owner}`;
}

function savedMode(owner: string): UnlockMode | null {
  try {
    return localStorage.getItem(modeKey(owner)) === "text" ? "text" : null;
  } catch {
    return null;
  }
}

/** Phantom (mobile) rejects the SDK's binary message; some wallets rewrite it. */
function walletBlocksStandard(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /cannot sign solana transactions|WALLET_ALTERS_MESSAGE|unsupported message|not supported/i.test(msg);
}

export function currentMode(): UnlockMode | null {
  return session?.mode ?? null;
}

async function hkdf32(secret: Uint8Array, info: string, length: number): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", secret as BufferSource, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: enc.encode("veil/text-unlock/v1") as BufferSource, info: enc.encode(info) as BufferSource },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

/**
 * For wallets that refuse the SDK's binary message (Phantom on phones). The
 * wallet signs one readable line instead; the viewing and nullifier keys are
 * derived from that signature. Spending is still authorised by the wallet's
 * own transaction signature, exactly as in the standard path. This gives a
 * different vault from the standard unlock, which is why the mode is remembered.
 */
async function unlockText(signer: WalletLike): Promise<Snapshot> {
  if (!signer.signMessage) throw new Error("This wallet can't sign messages. Try Phantom or Solflare.");
  const owner = signer.publicKey.toBase58();
  lock();

  const text = `Unlock Veil\n\nSign to open your private vault. No transaction, no fee.\n\nWallet: ${owner}\nVault key v1`;
  const signing = signer.signMessage(new TextEncoder().encode(text));
  const loading = Promise.all([
    getSprClient(),
    import("@heliuslabs/spr"),
    import("@heliuslabs/spr/keypair"),
    import("@solana/kit"),
  ]);
  const [signature, [client, sdk, kp, kit]] = await Promise.all([signing, loading]);
  if (signature.length !== 64) throw new Error("Your wallet returned an unexpected signature. Try again.");

  const viewing = kp.ViewingKey.fromBytes((await hkdf32(signature, "viewing", 32)) as never);
  const nullifier = kp.NullifierKey.fromSecret((await hkdf32(signature, "nullifier", 31)) as never);
  let keys: ReturnType<typeof sdk.LocalKeys.fromKeys>;
  try {
    const address = kp.ShieldedAddress.fromPublicKeys(
      kp.ShieldedPublicKey.fromEd25519(signer.publicKey.toBytes() as never),
      nullifier.publicKey(),
      viewing.publicKey(),
    );
    keys = sdk.LocalKeys.fromKeys({ address, viewingKeys: [viewing], nullifierKey: nullifier }, client.proofService);
  } finally {
    viewing.destroy();
    nullifier.destroy();
  }
  const wallet = new sdk.Wallet({ identity: keys.address() });

  const next: Session = { owner, signer, client, sdk, kit, wallet, keys, mode: "text" };
  const snap = await syncNow(next);
  session = next;
  try {
    localStorage.setItem(modeKey(owner), "text");
  } catch {
    /* private mode: it falls back to trying standard first next time */
  }
  return snap;
}

async function unlockStandard(signer: WalletLike): Promise<Snapshot> {
  if (!signer.signMessage) throw new Error("This wallet can't sign messages. Try Phantom or Solflare.");
  const owner = signer.publicKey.toBase58();
  if (session && session.owner === owner) return syncNow(session);
  lock();

  // Ask the wallet FIRST, straight from the tap, so the prompt opens at once.
  // (Wallets can delay or block a prompt that comes after slow async work.)
  // The SDK and client keep loading in the background while the user approves.
  const { ed25519DerivationMessage } = await import("@heliuslabs/spr/keypair");
  const message = ed25519DerivationMessage(signer.publicKey.toBytes() as Parameters<typeof ed25519DerivationMessage>[0]);
  const signing = signer.signMessage(message);
  const loading = Promise.all([getSprClient(), import("@heliuslabs/spr"), import("@solana/kit")]);
  const [derivationSeed, [client, sdk, kit]] = await Promise.all([signing, loading]);

  let keys: ReturnType<typeof sdk.LocalKeys.fromDerivationSeed>;
  try {
    keys = sdk.LocalKeys.fromDerivationSeed(
      { solanaPublicKey: kit.address(owner), derivationSeed },
      client.proofService,
    );
  } catch (e) {
    const code = (e as { code?: string; causeCode?: string })?.code ?? "";
    if (/DERIVATION_SEED/.test(code)) {
      throw new Error(`WALLET_ALTERS_MESSAGE:${await diagnoseSignature(kit, owner, derivationSeed, message)}`);
    }
    throw e;
  }
  const wallet = new sdk.Wallet({ identity: keys.address() });

  const next: Session = { owner, signer, client, sdk, kit, wallet, keys, mode: "standard" };
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

  // v1 transactions carry no lifetimeConstraint after our re-encode, so the
  // kit's sendAndConfirm helper can't be used. Send raw bytes and poll instead.
  const rpc = client.solanaRpc as unknown as {
    sendTransaction: (w: string, o: object) => { send: () => Promise<string> };
    getSignatureStatuses: (s: string[]) => {
      send: () => Promise<{ value: Array<{ err: unknown; confirmationStatus?: string } | null> }>;
    };
  };
  const wireB64 = kit.getBase64EncodedWireTransaction(signedTx as never);
  const sent = await rpc.sendTransaction(wireB64, { encoding: "base64", maxRetries: 5n }).send();
  const deadline = Date.now() + 60_000;
  for (;;) {
    const { value } = await rpc.getSignatureStatuses([sent]).send();
    const st = value[0];
    if (st?.err) throw new Error("Transaction failed on-chain");
    if (st && (st.confirmationStatus === "confirmed" || st.confirmationStatus === "finalized")) break;
    if (Date.now() > deadline) throw new Error("Network is slow. Check Activity in a minute.");
    await new Promise((r) => setTimeout(r, 1200));
  }

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
  const o = (typeof e === "object" && e !== null ? e : {}) as {
    code?: unknown;
    causeCode?: unknown;
    causeCodes?: unknown;
  };
  // The SDK wraps the real reason: code=WALLET_BUILD_TRANSFER, causeCode=WALLET_RECIPIENT_NOT_REGISTERED.
  const codes = [o.code, o.causeCode, ...(Array.isArray(o.causeCodes) ? o.causeCodes : [])]
    .filter((c): c is string => typeof c === "string")
    .join(" ");
  const msg = e instanceof Error ? e.message : String(e);
  if (/User rejected|rejected the request|declined/i.test(msg)) return "Cancelled in your wallet";
  if (msg.startsWith("WALLET_ALTERS_MESSAGE")) {
    return `Your wallet changed the message before signing (${msg.split(":")[1] ?? "unknown"}). Try Phantom or Solflare.`;
  }
  if (codes.includes("USER_RECORD_KEYS_MISMATCH")) {
    return "This wallet was set up with a different unlock. Unlock the way you did before.";
  }
  if (codes.includes("RECIPIENT_NOT_REGISTERED") || codes.includes("USER_REGISTRY_RECORD_NOT_FOUND")) {
    return "They haven't set up Veil yet";
  }
  if (codes.includes("INSUFFICIENT_BALANCE")) return "Not enough private balance";
  if (codes.includes("TOO_MANY_INPUTS")) return "Too many small deposits. Try a smaller amount.";
  if (codes.includes("INVALID_ADDRESS")) return "That address doesn't look right";
  if (codes.includes("ATTESTATION") || /attest|policy/i.test(msg)) return "Couldn't verify the secure prover. Try again shortly.";
  if (code2(o.code) === "-32002" || /#-32002|preflight|simulation failed|0x1\b/i.test(msg)) return "Not enough SOL for this and the network fee";
  if (/insufficient/i.test(msg)) return "Not enough private balance";
  if (/not a valid|invalid address|Invalid base58/i.test(msg)) return "That address doesn't look right";
  // Unknown: show the SDK codes so failures are diagnosable instead of a bare wrapper name.
  if (codes) return codes.replace(/WALLET_/g, "").trim().split(/\s+/).slice(0, 3).join(" · ");
  return msg.length > 140 ? `${msg.slice(0, 137)}…` : msg;
}

function code2(c: unknown) {
  return typeof c === "string" || typeof c === "number" ? String(c) : "";
}
