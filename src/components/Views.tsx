"use client";

import { useState } from "react";
import Image from "next/image";
import Pane from "./Pane";
import { I } from "./Icons";
import { formatSol, solToLamports, type HistoryItem } from "@/lib/spr";
import type { Veil } from "@/lib/use-veil";

export type SendMode = "single" | "batch" | "payroll";

/* ---------- shared ---------- */
function balanceText(veil: Veil, hide: boolean) {
  if (hide) return "••••••";
  if (!veil.connected || !veil.ready) return "—";
  return formatSol(veil.balance);
}

function Status({ veil, heliusEnabled }: { veil: Veil; heliusEnabled: boolean }) {
  if (veil.error) return <span role="alert" className="text-alert">{veil.error}</span>;
  if (veil.busy) return <span className="text-gold-hi">{veil.busy}…</span>;
  if (!heliusEnabled) return <>Helius is not configured</>;
  return <>{veil.ready ? "Synced" : "Locked"}</>;
}

function Balance({ veil, hide, setHide, heliusEnabled }: { veil: Veil; hide: boolean; setHide: (v: boolean) => void; heliusEnabled: boolean }) {
  return (
    <div className="relative pt-2 pb-8 overflow-x-clip">
      <div className="pointer-events-none absolute -right-[22%] -top-10 w-[78%] md:hidden opacity-70">
        <Image src="/ring.webp" alt="" width={1100} height={1100} priority className="ring-mask drift w-full h-auto" />
      </div>
      <div className="relative">
        <div className="flex items-center gap-2 text-sm text-dim">
          Private balance
          <button onClick={() => setHide(!hide)} aria-pressed={!hide} aria-label={hide ? "Show balance" : "Hide balance"} className="grid place-items-center w-8 h-8 rounded-full hover:text-bone btn-glass">
            {hide ? I.eye(16) : I.eyeOff(16)}
          </button>
        </div>
        <div className="display mt-3 flex items-baseline gap-3 leading-none">
          <span className="text-[clamp(2.6rem,12vw,4.4rem)] font-medium tabular-nums">{balanceText(veil, hide)}</span>
          {!hide && veil.ready && <span className="text-lg text-dim">SOL</span>}
        </div>
        <p className="mt-4 text-sm text-dim"><Status veil={veil} heliusEnabled={heliusEnabled} /></p>
      </div>
    </div>
  );
}

function describe(t: HistoryItem): { label: string; sign: "+" | "−" | ""; pub: boolean } {
  switch (t.kind) {
    case "deposit": return { label: "Deposited", sign: "+", pub: true };
    case "publicWithdrawal": return { label: "Withdrawn", sign: "−", pub: true };
    case "privateTransfer":
      return t.direction === "inbound" ? { label: "Received", sign: "+", pub: false }
        : t.direction === "outbound" ? { label: "Sent", sign: "−", pub: false }
        : { label: "Moved", sign: "", pub: false };
    default: return { label: "Maintenance", sign: "", pub: false };
  }
}

function ActivityList({ items }: { items: HistoryItem[] }) {
  return (
    <ul className="divide-y divide-[rgba(255,214,120,0.08)]">
      {items.map((t) => {
        const d = describe(t);
        return (
          <li key={t.id} className="flex items-center gap-3.5 py-4">
            <span className={`grid place-items-center w-10 h-10 rounded-full shrink-0 ${d.pub ? "text-dim" : "text-gold-hi"}`}
              style={{ boxShadow: `0 0 0 1px ${d.pub ? "rgba(255,255,255,0.12)" : "rgba(255,217,138,0.5)"} inset` }}
              title={d.pub ? "Public on-chain" : "Private"}>
              {d.pub ? (d.sign === "+" ? I.down(17) : I.up(17)) : I.ring(19)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[15px]">{d.label}</div>
              <div className="text-xs text-dim">{d.pub ? "Public" : "Private"}</div>
            </div>
            <span className={`display text-sm tabular-nums ${d.sign === "+" ? "text-gold-hi" : "text-bone"}`}>
              {d.sign}{formatSol(t.amount)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Empty({ text, action, onAction }: { text: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <span className="grid place-items-center w-14 h-14 rounded-full text-gold" style={{ boxShadow: "0 0 0 1px rgba(255,217,138,0.35) inset, 0 0 30px -6px rgba(232,169,58,0.5)" }}>
        {I.ring(26)}
      </span>
      <p className="text-dim">{text}</p>
      {action && <button onClick={onAction} className="btn btn-glass !py-2.5 !px-5 !text-sm">{action}</button>}
    </div>
  );
}

/* ---------- Home ---------- */
export function HomeView({ veil, hide, setHide, heliusEnabled, onDeposit, onWithdraw, onSetup, onActivity, onPayroll }: {
  veil: Veil; hide: boolean; setHide: (v: boolean) => void; heliusEnabled: boolean;
  onDeposit: () => void; onWithdraw: () => void; onSetup: () => void; onActivity: () => void; onPayroll: () => void;
}) {
  const { ready, busy } = veil;
  return (
    <div>
      <Balance veil={veil} hide={hide} setHide={setHide} heliusEnabled={heliusEnabled} />

      {ready ? (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onDeposit} disabled={busy !== null} className="btn btn-gold !py-4">{I.down(18)} Deposit</button>
          <button onClick={onWithdraw} disabled={busy !== null} className="btn btn-glass !py-4">{I.up(18)} Withdraw</button>
        </div>
      ) : (
        <div className="space-y-3">
          <button onClick={() => void veil.unlock()} disabled={busy !== null} className="btn btn-gold w-full !py-4">
            {I.lock(18)} {busy ?? "Unlock vault"}
          </button>
          <button onClick={onSetup} disabled={busy !== null} className="w-full text-sm text-dim hover:text-bone py-2">Set up treasury so others can pay you</button>
        </div>
      )}

      <Pane className="mt-8 p-5 md:p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="display text-base">Recent</h2>
          {ready && (
            <div className="flex items-center gap-1">
              <button onClick={() => void veil.refresh()} disabled={busy !== null} className="text-sm text-dim hover:text-bone px-2.5 py-1">Sync</button>
              {veil.history.length > 3 && <button onClick={onActivity} className="text-sm text-gold-hi px-2.5 py-1">All</button>}
            </div>
          )}
        </div>
        {veil.history.length === 0 ? (
          <Empty text="Nothing here yet" action={ready ? "Send a private payment" : undefined} onAction={onPayroll} />
        ) : (
          <ActivityList items={veil.history.slice(0, 3)} />
        )}
      </Pane>
    </div>
  );
}

/* ---------- Treasury ---------- */
export function TreasuryView({ veil, hide, setHide, onDeposit, onWithdraw, onSetup }: {
  veil: Veil; hide: boolean; setHide: (v: boolean) => void; onDeposit: () => void; onWithdraw: () => void; onSetup: () => void;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    if (!veil.owner) return;
    try {
      await navigator.clipboard.writeText(veil.owner);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked: the address is still shown */
    }
  }
  const busy = veil.busy !== null;
  return (
    <div className="space-y-4 pt-2">
      <h1 className="display text-2xl">Treasury</h1>
      <Pane className="p-6 md:p-7">
        <div className="flex items-center justify-between">
          <span className="text-sm text-dim">Private balance</span>
          <button onClick={() => setHide(!hide)} aria-pressed={!hide} aria-label={hide ? "Show balance" : "Hide balance"} className="grid place-items-center w-8 h-8 rounded-full hover:text-bone btn-glass">
            {hide ? I.eye(16) : I.eyeOff(16)}
          </button>
        </div>
        <div className="display mt-3 text-[clamp(2.2rem,10vw,3.4rem)] leading-none tabular-nums">
          {balanceText(veil, hide)}{!hide && veil.ready && <span className="ml-3 text-base text-dim">SOL</span>}
        </div>
        <div className="mt-7 grid grid-cols-2 gap-3">
          {veil.ready ? (
            <>
              <button onClick={onDeposit} disabled={busy} className="btn btn-gold">{I.down(17)} Deposit</button>
              <button onClick={onWithdraw} disabled={busy} className="btn btn-glass">{I.up(17)} Withdraw</button>
            </>
          ) : (
            <button onClick={() => void veil.unlock()} disabled={busy} className="btn btn-gold col-span-2">{I.lock(17)} {veil.busy ?? "Unlock vault"}</button>
          )}
        </div>
        {veil.error && <p role="alert" className="mt-4 text-sm text-alert">{veil.error}</p>}
      </Pane>

      <Pane className="p-6 md:p-7">
        <h2 className="display text-base">Get paid privately</h2>
        <p className="mt-2 text-sm text-dim">Share your address. People can pay you once your treasury is set up.</p>
        {veil.owner && (
          <button onClick={copy} className="mt-5 w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left bg-black/40 hover:bg-black/60 transition-colors" style={{ boxShadow: "0 0 0 1px rgba(255,214,120,0.16) inset" }}>
            <span className="flex-1 font-mono text-xs break-all text-bone/90">{veil.owner}</span>
            <span className={`shrink-0 text-xs ${copied ? "text-gold-hi" : "text-dim"}`}>{copied ? "Copied" : I.copy(18)}</span>
          </button>
        )}
        <button onClick={onSetup} disabled={busy} className="btn btn-glass mt-4 w-full">Set up treasury</button>
      </Pane>
    </div>
  );
}

/* ---------- Send ---------- */
type Row = { to: string; amount: string };
const MODES: { id: SendMode; label: string }[] = [
  { id: "single", label: "Payment" },
  { id: "batch", label: "Batch" },
  { id: "payroll", label: "Payroll" },
];

export function SendView({ veil, mode, setMode }: { veil: Veil; mode: SendMode; setMode: (m: SendMode) => void }) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [rows, setRows] = useState<Row[]>([{ to: "", amount: "" }]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const busy = veil.busy !== null;

  function guard(): boolean {
    setDone(false);
    setLocalError(null);
    veil.clearError();
    if (!veil.connected) { setLocalError("Connect your wallet first"); return false; }
    if (!veil.ready) { void veil.unlock(); return false; }
    return true;
  }
  async function sendOne() {
    if (!guard()) return;
    let lamports: bigint;
    try { lamports = solToLamports(amount); } catch (e: unknown) { return setLocalError(e instanceof Error ? e.message : "Invalid amount"); }
    if (to.trim() === "") return setLocalError("Enter a recipient");
    if (await veil.send(to, lamports)) { setTo(""); setAmount(""); setDone(true); }
  }
  async function sendBatch() {
    if (!guard()) return;
    try {
      const payments = rows.map((r) => ({ recipient: r.to, amount: solToLamports(r.amount) }));
      if (payments.some((p) => p.recipient.trim() === "")) throw new Error("Fill in every address");
      if (await veil.sendMany(payments)) { setRows([{ to: "", amount: "" }]); setDone(true); }
    } catch (e: unknown) {
      setLocalError(e instanceof Error ? e.message : "Check the amounts");
    }
  }
  const setRow = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const error = localError ?? veil.error;
  const idx = MODES.findIndex((m) => m.id === mode);

  return (
    <div className="space-y-5 pt-2">
      <h1 className="display text-2xl">Send</h1>
      <div className="seg" role="tablist" style={{ ["--n" as string]: 3, ["--i" as string]: idx }}>
        <span className="seg-thumb" aria-hidden="true" />
        {MODES.map((m) => (
          <button key={m.id} role="tab" aria-selected={mode === m.id}
            onClick={() => { setMode(m.id); setDone(false); setLocalError(null); }}>
            {m.label}
          </button>
        ))}
      </div>

      <Pane className="p-6 md:p-7 space-y-5">
        {mode === "single" && (
          <>
            <div>
              <label className="label" htmlFor="recipient">To</label>
              <input id="recipient" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Wallet address" autoComplete="off" spellCheck={false} className="field font-mono !text-xs" />
            </div>
            <div>
              <label className="label" htmlFor="amount">Amount</label>
              <div className="relative">
                <input id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" inputMode="decimal" autoComplete="off" className="field display !text-2xl pr-16" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-dim">SOL</span>
              </div>
            </div>
            <button onClick={sendOne} disabled={busy} className="btn btn-gold w-full !py-4">{veil.busy ? `${veil.busy}…` : <>{I.send(18)} Send privately</>}</button>
          </>
        )}

        {mode !== "single" && (
          <>
            <div className="space-y-3">
              {rows.map((r, i) => (
                <div key={i} className="flex gap-2 items-stretch">
                  <input value={r.to} onChange={(e) => setRow(i, { to: e.target.value })} placeholder={mode === "payroll" ? "Employee address" : "Address"} aria-label={`Recipient ${i + 1}`} autoComplete="off" spellCheck={false} className="field font-mono !text-xs flex-1 min-w-0" />
                  <input value={r.amount} onChange={(e) => setRow(i, { amount: e.target.value })} placeholder="0.00" aria-label={`Amount ${i + 1}`} inputMode="decimal" autoComplete="off" className="field display w-24 !px-3" />
                  {rows.length > 1 && (
                    <button onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} aria-label={`Remove recipient ${i + 1}`} className="btn btn-glass !px-3.5">{I.close(16)}</button>
                  )}
                </div>
              ))}
            </div>
            {rows.length < 15 && (
              <button onClick={() => setRows((rs) => [...rs, { to: "", amount: "" }])} className="flex items-center gap-2 text-sm text-gold-hi">{I.plus(16)} Add recipient</button>
            )}
            <button onClick={sendBatch} disabled={busy} className="btn btn-gold w-full !py-4">
              {veil.busy ? `${veil.busy}…` : mode === "payroll" ? "Run payroll" : "Send batch"}
            </button>
            <p className="text-xs text-dim">Amounts stay hidden. Everyone you pay must have set up Veil.</p>
          </>
        )}

        {error && <p role="alert" className="text-sm text-alert">{error}</p>}
        {done && !error && <p className="text-sm text-gold-hi">Sent privately</p>}
      </Pane>
    </div>
  );
}

/* ---------- Activity ---------- */
export function ActivityView({ history, onSend }: { history: HistoryItem[]; onSend: () => void }) {
  return (
    <div className="space-y-4 pt-2">
      <h1 className="display text-2xl">Activity</h1>
      <Pane className="p-5 md:p-6">
        {history.length === 0 ? <Empty text="No activity yet" action="Send a private payment" onAction={onSend} /> : <ActivityList items={history} />}
      </Pane>
    </div>
  );
}
