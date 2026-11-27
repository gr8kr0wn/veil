"use client";

import { useEffect, useState, type ReactNode } from "react";
import { solToLamports } from "@/lib/spr";
import Pane from "./Pane";
import { I } from "./Icons";

/** Glass bottom sheet on phones, centred card on laptops. */
export function Modal({ title, onClose, locked, children }: { title: string; onClose: () => void; locked?: boolean; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && !locked && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose, locked]);
  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-md" onClick={locked ? undefined : onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
      <Pane className="sheet-enter rounded-b-none md:rounded-b-[28px] p-6 pb-9 md:pb-6">
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="display text-lg font-medium">{title}</h3>
            <button onClick={onClose} aria-label="Close" className="grid place-items-center w-9 h-9 rounded-full text-dim hover:text-bone btn-glass">
              {I.close(16)}
            </button>
          </div>
          {children}
        </div>
      </Pane>
      </div>
    </div>
  );
}

type Props = {
  open: boolean;
  title: string;
  cta: string;
  /** Show a destination field (withdraw). */
  address?: { label: string; initial: string };
  note?: string;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (address: string, lamports: bigint) => Promise<boolean>;
};

/** Deposit and Withdraw. */
export default function Sheet(props: Props) {
  // Mounted only while open, so every opening starts with fresh fields.
  return props.open ? <SheetBody {...props} /> : null;
}

function SheetBody({ title, cta, address, note, busy, error, onClose, onSubmit }: Props) {
  const [amount, setAmount] = useState("");
  const [dest, setDest] = useState(address?.initial ?? "");
  const [localError, setLocalError] = useState<string | null>(null);

  async function submit() {
    setLocalError(null);
    let lamports: bigint;
    try {
      lamports = solToLamports(amount);
    } catch (e: unknown) {
      setLocalError(e instanceof Error ? e.message : "Enter a valid amount");
      return;
    }
    if (address && dest.trim() === "") {
      setLocalError("Enter an address");
      return;
    }
    if (await onSubmit(dest, lamports)) onClose();
  }

  return (
    <Modal title={title} onClose={onClose} locked={busy}>
      {address && (
        <div>
          <label className="label" htmlFor="sheet-address">{address.label}</label>
          <input id="sheet-address" value={dest} onChange={(e) => setDest(e.target.value)} autoComplete="off" spellCheck={false} className="field font-mono !text-xs" />
        </div>
      )}
      <div>
        <label className="label" htmlFor="sheet-amount">Amount</label>
        <div className="relative">
          <input id="sheet-amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" inputMode="decimal" autoComplete="off" className="field display !text-2xl pr-16" autoFocus />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-dim">SOL</span>
        </div>
      </div>
      {note && (
        <p className="flex items-start gap-2 text-xs text-dim">
          <span className="mt-px text-gold shrink-0">{I.eye(14)}</span>
          {note}
        </p>
      )}
      {(localError || error) && <p role="alert" className="text-sm text-alert">{localError ?? error}</p>}
      <button onClick={submit} disabled={busy} className="btn btn-gold w-full">
        {busy ? "Working…" : cta}
      </button>
    </Modal>
  );
}
