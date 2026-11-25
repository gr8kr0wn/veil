"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import * as spr from "./spr";
import type { Payment, Snapshot, WalletLike } from "./spr";

export type Phase = "locked" | "unlocking" | "ready";

const EMPTY: Snapshot = { balance: 0n, history: [] };

/** One place for the private-pool state and every action the UI can take. */
export function useVeil() {
  const { publicKey, signMessage, signTransaction, connected } = useWallet();
  const [unlockedFor, setUnlockedFor] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [snap, setSnap] = useState<Snapshot>(EMPTY);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const owner = publicKey?.toBase58() ?? null;
  const busyRef = useRef(false);

  // Switching or disconnecting the wallet drops the derived keys from memory.
  useEffect(() => {
    if (spr.isUnlocked() && !(owner && spr.isUnlocked(owner))) spr.lock();
  }, [owner]);

  const ready = owner !== null && unlockedFor === owner;
  const phase: Phase = ready ? "ready" : unlocking ? "unlocking" : "locked";

  const signer = useCallback((): WalletLike => {
    if (!publicKey) throw new Error("Connect your wallet first");
    return { publicKey, signMessage, signTransaction };
  }, [publicKey, signMessage, signTransaction]);

  const run = useCallback(async (label: string, job: () => Promise<Snapshot | void>) => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(label);
    setError(null);
    try {
      const next = await job();
      if (next) setSnap(next);
      return true;
    } catch (e: unknown) {
      setError(spr.friendlyError(e));
      return false;
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  }, []);

  const unlock = useCallback(
    () =>
      run("Unlocking", async () => {
        setUnlocking(true);
        try {
          const s = await spr.unlock(signer());
          setUnlockedFor(owner);
          return s;
        } finally {
          setUnlocking(false);
        }
      }),
    [run, signer, owner],
  );

  /** Unlock + make this wallet payable by other Veil users. */
  const createTreasury = useCallback(
    () =>
      run("Setting up", async () => {
        setUnlocking(true);
        try {
          await spr.unlock(signer());
          setUnlockedFor(owner);
          return await spr.register();
        } finally {
          setUnlocking(false);
        }
      }),
    [run, signer, owner],
  );

  const refresh = useCallback(() => run("Syncing", () => spr.refresh()), [run]);
  const deposit = useCallback((amount: bigint) => run("Depositing", () => spr.deposit(amount)), [run]);
  const send = useCallback((to: string, amount: bigint) => run("Sending", () => spr.send(to, amount)), [run]);
  const sendMany = useCallback((p: Payment[]) => run("Sending", () => spr.sendMany(p)), [run]);
  const withdraw = useCallback((to: string, amount: bigint) => run("Withdrawing", () => spr.withdraw(to, amount)), [run]);

  return {
    connected,
    owner,
    phase,
    ready,
    balance: ready ? snap.balance : 0n,
    history: ready ? snap.history : [],
    busy,
    error,
    clearError: () => setError(null),
    unlock,
    createTreasury,
    refresh,
    deposit,
    send,
    sendMany,
    withdraw,
  };
}

export type Veil = ReturnType<typeof useVeil>;
