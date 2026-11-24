"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { getZolanaClient, hasHeliusKey } from "@/lib/zolana";

type Tab = "dashboard" | "send" | "treasury" | "transactions" | "settings";

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

function LockIcon() {
  return (
    <Icon className="w-3.5 h-3.5">
      <path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" />
    </Icon>
  );
}

export default function Home() {
  const { publicKey, connected } = useWallet();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [sendMode, setSendMode] = useState<"single" | "batch" | "payroll">("single");
  const [hideBalances, setHideBalances] = useState(true);
  const [heliusReady, setHeliusReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  async function syncPrivate() {
    if (!hasHeliusKey()) {
      setSyncError("Helius API key missing");
      return;
    }
    setSyncing(true);
    setSyncError(null);
    try {
      await getZolanaClient();
      setHeliusReady(true);
    } catch (e: any) {
      setSyncError(e?.message || "Failed to connect to Helius Zolana");
    } finally {
      setSyncing(false);
    }
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
            Devnet
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
              connected={connected}
              publicKey={publicKey}
              hideBalances={hideBalances}
              setHideBalances={setHideBalances}
              heliusReady={heliusReady}
              syncing={syncing}
              syncError={syncError}
              onSync={syncPrivate}
            />
          )}
          {activeTab === "send" && <SendView mode={sendMode} setMode={setSendMode} />}
          {activeTab === "treasury" && <TreasuryView hideBalances={hideBalances} />}
          {activeTab === "transactions" && <TransactionsView />}
          {activeTab === "settings" && <SettingsView />}
        </div>
      </main>

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

function DashboardView({
  connected,
  publicKey,
  hideBalances,
  setHideBalances,
  heliusReady,
  syncing,
  syncError,
  onSync,
}: {
  connected: boolean;
  publicKey: any;
  hideBalances: boolean;
  setHideBalances: (v: boolean) => void;
  heliusReady: boolean;
  syncing: boolean;
  syncError: string | null;
  onSync: () => void;
}) {
  const balanceDisplay = hideBalances ? "••••••" : connected ? "0.00" : "—";

  return (
    <div className="space-y-4">
      {/* Hero glass */}
      <div className="card overflow-hidden p-6">
        <div className="absolute inset-0 bg-[url('/hero-ring.jpg')] bg-cover bg-center opacity-15" />
        <div className="absolute -top-24 -right-16 w-64 h-64 rounded-full bg-yellow-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-medium text-yellow-400 mb-4">
            <LockIcon /> Helius Privacy Rings
          </div>
          <h1 className="text-[1.9rem] font-semibold leading-[1.15] tracking-tight mb-2.5">
            Your Business<br />Finances Shouldn’t<br />Be Public.
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            Private treasury and payments on Solana.
          </p>
          <button className="btn btn-primary px-5 py-3 rounded-full">Create Treasury</button>
        </div>
      </div>

      {/* Balance glass */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400">Private Balance</span>
          <button
            onClick={() => setHideBalances(!hideBalances)}
            className="icon-btn"
            aria-label={hideBalances ? "Show balance" : "Hide balance"}
            aria-pressed={!hideBalances}
          >
            {hideBalances ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        <div className="num text-4xl font-semibold tracking-tight">{balanceDisplay}</div>
        {connected && publicKey && (
          <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-zinc-400 font-mono">
            {publicKey.toBase58().slice(0, 6)}…{publicKey.toBase58().slice(-4)}
          </div>
        )}
        {!connected && (
          <div className="text-xs text-zinc-500 mt-1.5">Connect wallet to view private balance</div>
        )}
        <div className="flex gap-2.5 mt-5">
          <button onClick={onSync} disabled={syncing} className="btn btn-primary flex-1 py-3 rounded-2xl">
            {syncing ? "Syncing…" : heliusReady ? "Synced" : "Sync Private"}
          </button>
          <button className="btn btn-ghost flex-1 py-3 rounded-2xl">Withdraw</button>
        </div>
        <div className="mt-3 text-[11px] text-zinc-500">
          {hasHeliusKey() ? (heliusReady ? "Helius Zolana connected" : "Tap Sync to connect") : "Add NEXT_PUBLIC_HELIUS_API_KEY"}
          {syncError ? <span className="text-red-400"> · {syncError}</span> : null}
        </div>
      </div>

      {/* Empty activity */}
      <div className="card p-5">
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400 mb-3">Recent Activity</div>
        <EmptyState text="No private transactions yet" />
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

function SendView({ mode, setMode }: { mode: string; setMode: (m: any) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Send</h2>
      <div className="flex gap-2 flex-wrap" role="tablist">
        {[
          { id: "single", label: "Payment" },
          { id: "batch", label: "Batch" },
          { id: "payroll", label: "Payroll" },
        ].map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => setMode(m.id)}
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
              <input id="recipient" placeholder="Recipient address" autoComplete="off" spellCheck={false} className="field" />
            </div>
            <div>
              <label className="label" htmlFor="amount">Amount</label>
              <input id="amount" placeholder="0.00" inputMode="decimal" autoComplete="off" className="field num" />
            </div>
            <button className="btn btn-primary w-full py-3.5 rounded-2xl">Send Private</button>
          </>
        )}
        {mode === "batch" && (
          <div className="text-sm text-zinc-500 text-center py-6">Batch payments coming soon</div>
        )}
        {mode === "payroll" && (
          <div className="text-sm text-zinc-500 text-center py-6">Payroll is a side feature under Send</div>
        )}
      </div>
    </div>
  );
}

function TreasuryView({ hideBalances }: { hideBalances: boolean }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Treasury</h2>
      <div className="card p-6">
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-400">Private Balance</div>
        <div className="num text-4xl font-semibold tracking-tight mt-1.5">{hideBalances ? "••••••" : "0.00"}</div>
        <button className="btn btn-primary mt-6 w-full py-3.5 rounded-2xl">Deposit</button>
      </div>
    </div>
  );
}

function TransactionsView() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Activity</h2>
      <div className="card p-6">
        <EmptyState text="No encrypted transactions yet" />
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight">Settings</h2>
      <div className="card px-5 text-sm divide-y divide-white/[0.06]">
        <div className="flex justify-between items-center py-4">
          <span className="text-zinc-400">Network</span>
          <span className="font-medium">Solana Devnet</span>
        </div>
        <div className="flex justify-between items-center py-4">
          <span className="text-zinc-400">Privacy</span>
          <span className="font-medium">Helius Zolana</span>
        </div>
      </div>
    </div>
  );
}
