"use client";

import { useState } from "react";
import { WalletMultiButton, useWalletModal } from "@solana/wallet-adapter-react-ui";
import Hero from "@/components/Hero";
import { useAppConfig } from "@/components/Providers";
import { NETWORK_LABEL } from "@/lib/config";
import Sheet from "@/components/Sheet";
import { formatSol, solToLamports, type HistoryItem } from "@/lib/spr";
import { useVeil, type Veil } from "@/lib/use-veil";

type Tab = "dashboard" | "send" | "treasury" | "transactions" | "settings";
type SendMode = "single" | "batch" | "payroll";

/* ---------- icons ---------- */
function Icon({ children, className = "w-[22px] h-[22px]" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const icons = {
  dashboard: (
    <Icon>
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </Icon>
  ),
  send: (
    <Icon>
      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
    </Icon>
  ),
  treasury: (
    <Icon>
      <path d="M3 10l9-6 9 6M5 10v9m4-9v9m6-9v9m4-9v9M3 21h18" />
    </Icon>
  ),
  transactions: (
    <Icon>
      <path d="M7 7h13m0 0-3-3m3 3-3 3M17 17H4m0 0 3-3m-3 3 3 3" />
    </Icon>
  ),
  settings: (
    <Icon>
      <path d="M4 7h9m4 0h3M4 17h3m4 0h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </Icon>
  ),
};

export default function Home() {
  const { setVisible: openWalletModal } = useWalletModal();
  const { heliusEnabled } = useAppConfig();
  const veil = useVeil();
  const { connected } = veil;
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sendMode, setSendMode] = useState<SendMode>("single");
  const [hideBalances, setHideBalances] = useState(true);
  const [sheet, setSheet] = useState<"deposit" | "withdraw" | null>(null);

  /** Connect -> unlock -> register, whichever step is next. */
  async function createTreasury() {
    if (!connected) return openWalletModal(true);
    if (await veil.createTreasury()) setActiveTab("treasury");
  }
  function openSheet(kind: "deposit" | "withdraw") {
    veil.clearError();
    if (!connected) return openWalletModal(true);
    if (!veil.ready) return void veil.unlock();
    setSheet(kind);
  }
  function goSend(mode: "single" | "payroll") {
    setSendMode(mode);
    setActiveTab("send");
  }

  const navItems = [
    { id: "dashboard" as const, label: "Home" },
    { id: "send" as const, label: "Send" },
    { id: "treasury" as const, label: "Treasury" },
    { id: "transactions" as const, label: "Activity" },
    { id: "settings" as const, label: "Settings" },
  ];

  return (
    <div className="relative isolate min-h-screen text-white">
      <div className="ambient" />

      {/* Top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-black/50 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-black text-sm bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-[0_6px_18px_-6px_rgba(234,179,8,0.7)]">
            V
          </div>
          <span className="font-medium tracking-[0.2em] text-[13px]">VEIL</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-full bg-white/5 text-[10px] font-medium flex items-center gap-1.5 border border-white/10 text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 dot-live" />
            {NETWORK_LABEL}
          </div>
          <WalletMultiButton
            style={{
              background: "#eab308",
              color: "#000",
              borderRadius: "9999px",
              fontWeight: 500,
              fontSize: "12px",
              padding: "6px 14px",
            }}
          />
        </div>
      </header>

      {/* Main */}
      <main className="pb-28 px-4 pt-5 max-w-lg mx-auto">
        {/* key re-triggers the entrance animation on every tab change */}
        <div key={activeTab} className="view-enter">
          {activeTab === "dashboard" && (
            <DashboardView
              veil={veil}
              hideBalances={hideBalances}
              setHideBalances={setHideBalances}
              heliusEnabled={heliusEnabled}
              onCreate={createTreasury}
              onSend={() => goSend("single")}
              onPayroll={() => goSend("payroll")}
              onTreasury={() => setActiveTab("treasury")}
              onDeposit={() => openSheet("deposit")}
              onWithdraw={() => openSheet("withdraw")}
              onActivity={() => setActiveTab("transactions")}
            />
          )}
          {activeTab === "send" && <SendView veil={veil} mode={sendMode} setMode={setSendMode} />}
          {activeTab === "treasury" && <TreasuryView veil={veil} hideBalances={hideBalances} onDeposit={() => openSheet("deposit")} />}
          {activeTab === "transactions" && <TransactionsView history={veil.history} />}
          {activeTab === "settings" && <SettingsView heliusEnabled={heliusEnabled} />}
        </div>
      </main>

      <Sheet
        open={sheet === "deposit"}
        title="Deposit"
        cta="Deposit to private balance"
        note="The deposit amount is public on-chain. Everything after it can stay private."
        busy={veil.busy !== null}
        error={veil.error}
        onClose={() => setSheet(null)}
        onSubmit={(_, amount) => veil.deposit(amount)}
      />
      <Sheet
        open={sheet === "withdraw"}
        title="Withdraw"
        cta="Withdraw"
        address={{ label: "To address", initial: veil.owner ?? "" }}
        note="Withdrawals are public on-chain: the destination and amount can be seen."
        busy={veil.busy !== null}
        error={veil.error}
        onClose={() => setSheet(null)}
        onSubmit={(to, amount) => veil.withdraw(to, amount)}
      />

      {/* Bottom navbar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/65 backdrop-blur-2xl border-t border-white/10 safe-bottom">
        <div className="max-w-lg mx-auto flex justify-around pt-2">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-current={active ? "page" : undefined}
                className={`nav-btn relative flex flex-col items-center gap-1 px-3 py-1.5 text-[10px] font-medium rounded-xl transition-all duration-200 active:scale-95 ${
                  active ? "text-yellow-400" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <span
                  className={`absolute -top-2 h-[2px] w-6 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)] transition-all duration-300 ${
                    active ? "opacity-100 scale-100" : "opacity-0 scale-50"
                  }`}
                />
                <span className={`transition-transform duration-200 ${active ? "-translate-y-px" : ""}`}>
                  {icons[item.id]}
                </span>
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/* ---------- helpers ---------- */
function balanceText(veil: Veil, hide: boolean) {
  if (hide) return "••••••";
  if (!veil.connected) return "—";
  return veil.ready ? `${formatSol(veil.balance)} SOL` : "—";
}

function Status({ veil, heliusEnabled }: { veil: Veil; heliusEnabled: boolean }) {
  if (veil.error) return <span className="text-red-400">{veil.error}</span>;
  if (veil.busy) return <span className="text-yellow-400/80">{veil.busy}…</span>;
  if (!heliusEnabled) return <>Helius not configured</>;
  return <>{veil.ready ? "Private balance synced" : "Unlock to see your private balance"}</>;
}

/* ---------- views ---------- */
function DashboardView({
  veil,
  hideBalances,
  setHideBalances,
  heliusEnabled,
  onCreate,
  onSend,
  onPayroll,
  onTreasury,
  onDeposit,
  onWithdraw,
  onActivity,
}: {
  veil: Veil;
  hideBalances: boolean;
  setHideBalances: (v: boolean) => void;
  heliusEnabled: boolean;
  onCreate: () => void;
  onSend: () => void;
  onPayroll: () => void;
  onTreasury: () => void;
  onDeposit: () => void;
  onWithdraw: () => void;
  onActivity: () => void;
}) {
  const { connected, owner, ready, busy } = veil;

  return (
    <div className="space-y-4">
      <Hero onCreate={onCreate} onSend={onSend} onPayroll={onPayroll} onTreasury={onTreasury} />

      {/* Balance glass */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400">Private Balance</span>
          <button onClick={() => setHideBalances(!hideBalances)} className="text-[11px] text-zinc-500 hover:text-zinc-300" aria-pressed={!hideBalances}>
            {hideBalances ? "Show" : "Hide"}
          </button>
        </div>
        <div className="num text-4xl font-semibold tracking-tight">{balanceText(veil, hideBalances)}</div>
        {connected && owner && (
          <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-zinc-400 font-mono">
            {owner.slice(0, 6)}…{owner.slice(-4)}
          </div>
        )}
        {!connected && <div className="text-xs text-zinc-500 mt-1.5">Connect wallet to view private balance</div>}

        <div className="flex gap-2.5 mt-5">
          {ready ? (
            <>
              <button onClick={onDeposit} disabled={busy !== null} className="btn btn-primary flex-1 py-3 rounded-2xl">Deposit</button>
              <button onClick={onWithdraw} disabled={busy !== null} className="btn btn-ghost flex-1 py-3 rounded-2xl">Withdraw</button>
            </>
          ) : (
            <button onClick={connected ? () => void veil.unlock() : onCreate} disabled={busy !== null} className="btn btn-primary flex-1 py-3 rounded-2xl">
              {busy ?? (connected ? "Unlock" : "Connect wallet")}
            </button>
          )}
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-zinc-500">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 11V8a5 5 0 0 1 9.5-2M6 11h12v9H6z" />
          </svg>
          Withdrawals are public on-chain
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
          <span><Status veil={veil} heliusEnabled={heliusEnabled} /></span>
          {ready && (
            <button onClick={() => void veil.refresh()} disabled={busy !== null} className="text-zinc-400 hover:text-white">Sync</button>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400">Recent Activity</span>
          {veil.history.length > 3 && (
            <button onClick={onActivity} className="text-[11px] text-zinc-400 hover:text-white">See all</button>
          )}
        </div>
        {veil.history.length === 0 ? (
          <EmptyState text="No private transactions yet" />
        ) : (
          <ActivityList items={veil.history.slice(0, 3)} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500">
        <Icon className="w-[18px] h-[18px]">
          <path d="M7 7h13m0 0-3-3m3 3-3 3M17 17H4m0 0 3-3m-3 3 3 3" />
        </Icon>
      </div>
      <p className="text-sm text-zinc-500">{text}</p>
    </div>
  );
}

function describe(t: HistoryItem): { label: string; sign: "+" | "−" | ""; pub: boolean } {
  switch (t.kind) {
    case "deposit":
      return { label: "Deposited", sign: "+", pub: true };
    case "publicWithdrawal":
      return { label: "Withdrawn", sign: "−", pub: true };
    case "privateTransfer":
      return t.direction === "inbound"
        ? { label: "Received", sign: "+", pub: false }
        : t.direction === "outbound"
          ? { label: "Sent", sign: "−", pub: false }
          : { label: "Moved", sign: "", pub: false };
    default:
      return { label: "Maintenance", sign: "", pub: false };
  }
}

function ActivityList({ items }: { items: HistoryItem[] }) {
  return (
    <ul className="divide-y divide-white/[0.06]">
      {items.map((t) => {
        const d = describe(t);
        return (
          <li key={t.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-medium">{d.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${d.pub ? "border-white/15 text-zinc-400" : "border-yellow-400/40 text-yellow-300"}`}>
                {d.pub ? "public" : "private"}
              </span>
            </div>
            <span className={`num text-sm ${d.sign === "+" ? "text-green-400" : "text-zinc-200"}`}>
              {d.sign}{formatSol(t.amount)} SOL
            </span>
          </li>
        );
      })}
    </ul>
  );
}

type Row = { to: string; amount: string };

function SendView({ veil, mode, setMode }: { veil: Veil; mode: SendMode; setMode: (m: SendMode) => void }) {
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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Send</h2>
      <div className="flex gap-2 flex-wrap" role="tablist">
        {([
          { id: "single", label: "Payment" },
          { id: "batch", label: "Batch" },
          { id: "payroll", label: "Payroll" },
        ] as const).map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => { setMode(m.id); setDone(false); setLocalError(null); }}
            className={`chip ${mode === m.id ? "chip-on" : "chip-off"}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="card p-5 space-y-4">
        {mode === "single" && (
          <>
            <div>
              <label className="label" htmlFor="recipient">Recipient</label>
              <input id="recipient" value={to} onChange={(e) => setTo(e.target.value)} placeholder="Recipient address" autoComplete="off" spellCheck={false} className="field font-mono text-xs" />
            </div>
            <div>
              <label className="label" htmlFor="amount">Amount (SOL)</label>
              <input id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" inputMode="decimal" autoComplete="off" className="field num" />
            </div>
            <button onClick={sendOne} disabled={busy} className="btn btn-primary w-full py-3.5 rounded-2xl">
              {veil.busy ?? "Send Private Payment"}
            </button>
          </>
        )}

        {(mode === "batch" || mode === "payroll") && (
          <>
            {rows.map((r, i) => (
              <div key={i} className="flex gap-2 items-start">
                <input value={r.to} onChange={(e) => setRow(i, { to: e.target.value })} placeholder={mode === "payroll" ? "Employee address" : "Address"} aria-label={`Recipient ${i + 1}`} autoComplete="off" spellCheck={false} className="field font-mono text-xs flex-1 min-w-0" />
                <input value={r.amount} onChange={(e) => setRow(i, { amount: e.target.value })} placeholder="0.00" aria-label={`Amount ${i + 1}`} inputMode="decimal" autoComplete="off" className="field num w-24" />
                {rows.length > 1 && (
                  <button onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} aria-label={`Remove recipient ${i + 1}`} className="btn btn-ghost px-3 rounded-xl self-stretch">×</button>
                )}
              </div>
            ))}
            {rows.length < 15 && (
              <button onClick={() => setRows((rs) => [...rs, { to: "", amount: "" }])} className="text-xs text-yellow-400 hover:text-yellow-300">+ Add recipient</button>
            )}
            <button onClick={sendBatch} disabled={busy} className="btn btn-primary w-full py-3.5 rounded-2xl">
              {veil.busy ?? (mode === "payroll" ? "Run Private Payroll" : "Send Batch")}
            </button>
            <p className="text-[11px] text-zinc-500">
              Amounts are hidden. Recipient wallets are visible on-chain. Each recipient must have set up Veil.
            </p>
          </>
        )}

        {error && <p className="text-xs text-red-400">{error}</p>}
        {done && !error && <p className="text-xs text-green-400">Sent privately</p>}
      </div>
    </div>
  );
}

function TreasuryView({ veil, hideBalances, onDeposit }: { veil: Veil; hideBalances: boolean; onDeposit: () => void }) {
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
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Treasury</h2>
      <div className="card p-6">
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400">Private Balance</div>
        <div className="num text-4xl font-semibold tracking-tight mt-1.5">{balanceText(veil, hideBalances)}</div>
        <button onClick={onDeposit} disabled={veil.busy !== null} className="btn btn-primary mt-6 w-full py-3.5 rounded-2xl">
          {veil.ready ? "Deposit" : veil.connected ? "Unlock" : "Connect wallet"}
        </button>
      </div>
      {veil.owner && (
        <div className="card p-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400 mb-2">Your Veil address</div>
          <button onClick={copy} className="w-full text-left font-mono text-xs break-all text-zinc-200">{veil.owner}</button>
          <div className="text-[11px] text-zinc-500 mt-2">{copied ? "Copied" : "Tap to copy. Others pay you here once you've set up your treasury."}</div>
        </div>
      )}
    </div>
  );
}

function TransactionsView({ history }: { history: HistoryItem[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Activity</h2>
      <div className="card p-5">
        {history.length === 0 ? <EmptyState text="No encrypted transactions yet" /> : <ActivityList items={history} />}
      </div>
    </div>
  );
}

function SettingsView({ heliusEnabled }: { heliusEnabled: boolean }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
      <div className="card px-5 text-sm divide-y divide-white/[0.06]">
        <div className="flex justify-between items-center py-4">
          <span className="text-zinc-400">Network</span>
          <span className="font-medium">Solana {NETWORK_LABEL}</span>
        </div>
        <div className="flex justify-between items-center py-4">
          <span className="text-zinc-400">Privacy</span>
          <span className="font-medium">Helius Privacy Rings</span>
        </div>
        <div className="flex justify-between items-center py-4">
          <span className="text-zinc-400">RPC</span>
          <span className="font-medium">{heliusEnabled ? "Helius" : "Public RPC"}</span>
        </div>
      </div>
    </div>
  );
}
