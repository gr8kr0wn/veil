"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Home() {
  const { publicKey, connected } = useWallet();
  const [activeTab, setActiveTab] = useState<"dashboard" | "send" | "treasury" | "transactions" | "settings">("dashboard");
  const [sendMode, setSendMode] = useState<"single" | "batch" | "payroll">("single");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: "▦" },
    { id: "send" as const, label: "Send", icon: "➤" },
    { id: "treasury" as const, label: "Treasury", icon: "▣" },
    { id: "transactions" as const, label: "Transactions", icon: "⇄" },
    { id: "settings" as const, label: "Settings", icon: "⚙" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-black/90 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 rounded-lg hover:bg-zinc-900"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center font-bold text-black text-sm">V</div>
          <div className="hidden sm:block">
            <div className="font-semibold tracking-wide text-sm">VEIL</div>
            <div className="text-[10px] text-zinc-500">Private Finance. Onchain.</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-full bg-zinc-900 text-[10px] flex items-center gap-1.5 border border-yellow-900/40">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Devnet
          </div>
          {publicKey && (
            <span className="text-[10px] text-zinc-500 hidden sm:block">
              {publicKey.toBase58().slice(0, 4)}…{publicKey.toBase58().slice(-4)}
            </span>
          )}
          <WalletMultiButton style={{ background: "#eab308", color: "#000", borderRadius: "9999px", fontWeight: 500, fontSize: "12px", padding: "6px 12px" }} />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - desktop */}
        <aside className="hidden md:flex w-56 border-r border-zinc-900 min-h-[calc(100vh-57px)] p-4 flex-col">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center gap-3 text-sm transition ${
                  activeTab === item.id
                    ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                    : "text-zinc-400 hover:bg-zinc-900"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-auto pt-6 text-xs text-zinc-600">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-yellow-500">🛡</span>
              Powered by Helius
            </div>
            <div>Privacy Rings</div>
            <div className="text-[10px] mt-1">Encrypt. Transact. Verify.</div>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-zinc-950 border-r border-zinc-800 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <span className="font-semibold">Menu</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-zinc-900 rounded">✕</button>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 text-sm ${
                      activeTab === item.id
                        ? "bg-yellow-500/10 text-yellow-400"
                        : "text-zinc-400"
                    }`}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </nav>
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 md:p-8">
          {activeTab === "dashboard" && <DashboardView connected={connected} publicKey={publicKey} />}
          {activeTab === "send" && <SendView mode={sendMode} setMode={setSendMode} />}
          {activeTab === "treasury" && <TreasuryView />}
          {activeTab === "transactions" && <TransactionsView />}
          {activeTab === "settings" && <SettingsView />}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 flex justify-around py-2 z-40">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] ${
              activeTab === item.id ? "text-yellow-400" : "text-zinc-500"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="md:hidden h-16" />
    </div>
  );
}

function DashboardView({ connected, publicKey }: { connected: boolean; publicKey: any }) {
  return (
    <div className="max-w-4xl">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-950 to-black border border-zinc-800 p-6 md:p-10 mb-6">
        <div className="absolute inset-0 bg-[url('/hero-ring.jpg')] bg-cover bg-center opacity-20" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400 mb-4">
            <span>🔒</span> Helius Privacy Rings
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-3">
            Your Business<br />Finances<br className="md:hidden" /> Shouldn’t<br />Be Public.
          </h1>
          <p className="text-zinc-400 text-sm md:text-base max-w-md mb-6">
            Manage payroll, treasury and payments with complete privacy on Solana.
          </p>
          <button className="px-5 py-2.5 rounded-full bg-yellow-500 text-black font-medium text-sm hover:bg-yellow-400">
            Create Treasury →
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Team Members", value: "24", sub: "+2" },
          { label: "Payroll Batches", value: "12", sub: "+1" },
          { label: "Total Payments", value: "$••••••", sub: "+28%" },
          { label: "Privacy Score", value: "100%", sub: "Encrypted" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide">{s.label}</div>
            <div className="text-xl md:text-2xl font-bold mt-1">{s.value}</div>
            <div className="text-xs text-green-400 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Private Balance */}
      <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-zinc-500">Total Private Balance</div>
          <div className="text-xs text-yellow-500 flex items-center gap-1">
            <span>🔒</span> Encrypted
          </div>
        </div>
        <div className="text-3xl md:text-4xl font-bold">
          {connected ? "$••••••" : "Connect wallet"}
        </div>
        {publicKey && (
          <div className="text-xs text-zinc-500 mt-2">
            Shielded address derived from {publicKey.toBase58().slice(0, 8)}…
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <button className="flex-1 py-2.5 rounded-xl bg-yellow-500 text-black text-sm font-medium">Deposit</button>
          <button className="flex-1 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm">Withdraw</button>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-sm font-medium text-zinc-400 mb-3">Recent Activity</h3>
        <div className="space-y-2">
          {[
            { type: "Private Transfer", amount: "••••", time: "2h ago", status: "Confirmed" },
            { type: "Payroll Batch", amount: "••••", time: "1d ago", status: "Confirmed" },
            { type: "Deposit", amount: "••••", time: "3d ago", status: "Confirmed" },
          ].map((tx, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <div>
                <div className="text-sm">{tx.type}</div>
                <div className="text-xs text-zinc-500">{tx.time}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{tx.amount}</div>
                <div className="text-[10px] text-green-400">{tx.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SendView({ mode, setMode }: { mode: string; setMode: (m: any) => void }) {
  return (
    <div className="max-w-md">
      <h2 className="text-2xl font-semibold mb-6">Send</h2>
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { id: "single", label: "Send Payment" },
          { id: "batch", label: "Batch Payment" },
          { id: "payroll", label: "Payroll" },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-4 py-2 rounded-full text-sm ${
              mode === m.id ? "bg-yellow-500 text-black" : "bg-zinc-900 text-zinc-400"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "single" && (
        <div className="space-y-4">
          <input placeholder="Recipient address" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-500/50" />
          <input placeholder="Amount (SOL)" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-500/50" />
          <button className="w-full py-3 rounded-xl bg-yellow-500 text-black font-medium">Send Private Payment</button>
          <p className="text-xs text-zinc-500 text-center">Amount encrypted via Helius Privacy Rings</p>
        </div>
      )}

      {mode === "batch" && (
        <div className="text-zinc-400 text-sm">Batch payment form — multiple recipients, one confidential flow.</div>
      )}

      {mode === "payroll" && (
        <div className="space-y-4">
          <div className="text-sm text-zinc-400">Payroll is a side feature under Send.</div>
          <button className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm">+ Add Employee</button>
          <div className="text-xs text-zinc-600">Manage schedules, batches, and history here.</div>
        </div>
      )}
    </div>
  );
}

function TreasuryView() {
  return (
    <div className="max-w-md">
      <h2 className="text-2xl font-semibold mb-6">Treasury</h2>
      <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800">
        <div className="text-sm text-zinc-500">Private Balance</div>
        <div className="text-4xl font-bold mt-2">$••••••</div>
        <button className="mt-6 w-full py-3 rounded-xl bg-yellow-500 text-black font-medium">Deposit Funds</button>
      </div>
    </div>
  );
}

function TransactionsView() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Transactions</h2>
      <div className="text-zinc-500 text-sm">Encrypted transaction history will appear here once connected to Helius Privacy Rings.</div>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="max-w-md">
      <h2 className="text-2xl font-semibold mb-6">Settings</h2>
      <div className="space-y-3 text-sm">
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
          <div className="text-zinc-500">Network</div>
          <div>Solana Devnet</div>
        </div>
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
          <div className="text-zinc-500">Privacy Layer</div>
          <div>Helius Privacy Rings</div>
        </div>
      </div>
    </div>
  );
}
