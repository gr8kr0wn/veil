"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Home() {
  const { publicKey, connected } = useWallet();
  const [activeTab, setActiveTab] = useState<"dashboard" | "send" | "treasury" | "transactions" | "settings">("dashboard");
  const [sendMode, setSendMode] = useState<"single" | "batch" | "payroll">("single");
  const [hideBalances, setHideBalances] = useState(true);

  const navItems = [
    { id: "dashboard" as const, label: "Home", icon: "▦" },
    { id: "send" as const, label: "Send", icon: "➤" },
    { id: "treasury" as const, label: "Treasury", icon: "▣" },
    { id: "transactions" as const, label: "Activity", icon: "⇄" },
    { id: "settings" as const, label: "Settings", icon: "⚙" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-yellow-500 rounded-xl flex items-center justify-center font-bold text-black text-sm">V</div>
          <span className="font-medium tracking-wide text-sm">VEIL</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-full bg-white/5 text-[10px] flex items-center gap-1.5 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Devnet
          </div>
          <WalletMultiButton style={{ background: "#eab308", color: "#000", borderRadius: "9999px", fontWeight: 500, fontSize: "12px", padding: "6px 14px" }} />
        </div>
      </header>

      {/* Main */}
      <main className="pb-24 px-4 pt-4 max-w-lg mx-auto">
        {activeTab === "dashboard" && (
          <DashboardView
            connected={connected}
            publicKey={publicKey}
            hideBalances={hideBalances}
            setHideBalances={setHideBalances}
          />
        )}
        {activeTab === "send" && <SendView mode={sendMode} setMode={setSendMode} />}
        {activeTab === "treasury" && <TreasuryView hideBalances={hideBalances} />}
        {activeTab === "transactions" && <TransactionsView />}
        {activeTab === "settings" && <SettingsView />}
      </main>

      {/* Bottom navbar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-2xl border-t border-white/10">
        <div className="max-w-lg mx-auto flex justify-around py-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] transition ${
                activeTab === item.id ? "text-yellow-400" : "text-zinc-500"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </button>
          ))}
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
}: {
  connected: boolean;
  publicKey: any;
  hideBalances: boolean;
  setHideBalances: (v: boolean) => void;
}) {
  const balanceDisplay = hideBalances ? "••••••" : connected ? "0.00" : "—";

  return (
    <div className="space-y-4">
      {/* Hero glass */}
      <div className="relative rounded-3xl overflow-hidden bg-white/5 border border-white/10 backdrop-blur-xl p-6">
        <div className="absolute inset-0 bg-[url('/hero-ring.jpg')] bg-cover bg-center opacity-15" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-yellow-400 mb-4">
            <span>🔒</span> Helius Privacy Rings
          </div>
          <h1 className="text-3xl font-semibold leading-tight mb-2">
            Your Business<br />Finances Shouldn’t<br />Be Public.
          </h1>
          <p className="text-zinc-400 text-sm mb-5">
            Private treasury and payments on Solana.
          </p>
          <button className="px-5 py-2.5 rounded-full bg-yellow-500 text-black text-sm font-medium">
            Create Treasury
          </button>
        </div>
      </div>

      {/* Balance glass */}
      <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-zinc-400">Private Balance</span>
          <button
            onClick={() => setHideBalances(!hideBalances)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400"
            aria-label="Toggle balance visibility"
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
        <div className="text-3xl font-semibold tracking-tight">{balanceDisplay}</div>
        {connected && publicKey && (
          <div className="text-[11px] text-zinc-500 mt-1">
            {publicKey.toBase58().slice(0, 6)}…{publicKey.toBase58().slice(-4)}
          </div>
        )}
        {!connected && (
          <div className="text-xs text-zinc-500 mt-1">Connect wallet to view private balance</div>
        )}
        <div className="flex gap-2 mt-4">
          <button className="flex-1 py-2.5 rounded-2xl bg-yellow-500 text-black text-sm font-medium">Deposit</button>
          <button className="flex-1 py-2.5 rounded-2xl bg-white/10 border border-white/10 text-sm">Withdraw</button>
        </div>
      </div>

      {/* Empty activity */}
      <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-5">
        <div className="text-xs text-zinc-400 mb-3">Recent Activity</div>
        <div className="text-sm text-zinc-500 text-center py-6">
          No private transactions yet
        </div>
      </div>
    </div>
  );
}

function SendView({ mode, setMode }: { mode: string; setMode: (m: any) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Send</h2>
      <div className="flex gap-2 flex-wrap">
        {[
          { id: "single", label: "Payment" },
          { id: "batch", label: "Batch" },
          { id: "payroll", label: "Payroll" },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-4 py-2 rounded-full text-sm ${
              mode === m.id ? "bg-yellow-500 text-black" : "bg-white/5 border border-white/10 text-zinc-400"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-5 space-y-4">
        {mode === "single" && (
          <>
            <input placeholder="Recipient address" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-yellow-500/40" />
            <input placeholder="Amount" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-yellow-500/40" />
            <button className="w-full py-3 rounded-2xl bg-yellow-500 text-black font-medium text-sm">Send Private</button>
          </>
        )}
        {mode === "batch" && (
          <div className="text-sm text-zinc-500 text-center py-4">Batch payments coming soon</div>
        )}
        {mode === "payroll" && (
          <div className="text-sm text-zinc-500 text-center py-4">Payroll is a side feature under Send</div>
        )}
      </div>
    </div>
  );
}

function TreasuryView({ hideBalances }: { hideBalances: boolean }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Treasury</h2>
      <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-6">
        <div className="text-xs text-zinc-400">Private Balance</div>
        <div className="text-3xl font-semibold mt-1">{hideBalances ? "••••••" : "0.00"}</div>
        <button className="mt-5 w-full py-3 rounded-2xl bg-yellow-500 text-black font-medium text-sm">Deposit</button>
      </div>
    </div>
  );
}

function TransactionsView() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Activity</h2>
      <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 text-center text-sm text-zinc-500">
        No encrypted transactions yet
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Settings</h2>
      <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-5 space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-400">Network</span>
          <span>Solana Devnet</span>
        </div>
        <div className="flex justify-between">
          <span className="text-zinc-400">Privacy</span>
          <span>Helius Zolana</span>
        </div>
      </div>
    </div>
  );
}
