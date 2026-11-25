"use client";

import { useState } from "react";
import { solToLamports } from "@/lib/spr";

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

/** Bottom glass sheet used by Deposit and Withdraw. */
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
    <div className="fixed inset-0 z-[60] flex items-end bg-black/60 backdrop-blur-sm" onClick={busy ? undefined : onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="card w-full max-w-lg mx-auto rounded-b-none rounded-t-3xl p-5 pb-8 space-y-4 view-enter" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto h-1 w-10 rounded-full bg-white/20" />
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>

        {address && (
          <div>
            <label className="label" htmlFor="sheet-address">{address.label}</label>
            <input id="sheet-address" value={dest} onChange={(e) => setDest(e.target.value)} autoComplete="off" spellCheck={false} className="field font-mono text-xs" />
          </div>
        )}
        <div>
          <label className="label" htmlFor="sheet-amount">Amount (SOL)</label>
          <input id="sheet-amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" inputMode="decimal" autoComplete="off" className="field num" autoFocus />
        </div>

        {note && <p className="text-[11px] text-zinc-500">{note}</p>}
        {(localError || error) && <p className="text-xs text-red-400">{localError ?? error}</p>}

        <button onClick={submit} disabled={busy} className="btn btn-primary w-full py-3.5 rounded-2xl">
          {busy ? "Working…" : cta}
        </button>
      </div>
    </div>
  );
}
