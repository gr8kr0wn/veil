"use client";

import { useState } from "react";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Home() {
  const { publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<"dashboard" | "send" | "treasury" | "transactions" | "settings">("dashboard");
  const [sendMode, setSendMode] = useState<"single" | "batch" | "payroll">("single");

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Nav */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-yellow-600 to-yellow-400 rounded-lg flex items-center justify-center font-bold text-black">V</div>
          <div>
            <div className="font-semibold tracking-wide">VEIL</div>
            <div className="text-xs text-zinc-500">Private Finance. Onchain.</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1.5 rounded-full bg-zinc-900 text-xs flex items-center gap-1.5 border border-yellow-900/40">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Devnet
          </div>
          {publicKey && (
            <span className="text-xs text-zinc-500 hidden md:block">
              {publicKey.toBase58().slice(0, 4)}…{publicKey.toBase58().slice(-4)}
            </span>
          )}
          <WalletMultiButton className="!bg-yellow-500 !text-black !rounded-full !font-medium !text-sm hover:!bg-yellow-400" />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 border-r border-zinc-900 min-h-[calc(100vh-73px)] p-4 space-y-1">
          {[
            { id: "dashboard", label: "Dashboard", icon: "▦" },
            { id: "send", label: "Send", icon: "➤" },
            { id: "treasury", label: "Treasury", icon: "▣" },
            { id: "transactions", label: "Transactions", icon: "⇄" },
            { id: "settings", label: "Settings", icon: "⚙" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center gap-3 text-sm transition ${
                activeTab === item.id
                  ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div className="mt-8 p-3 rounded-xl border border-yellow-900/30 bg-zinc-950 text-xs">
            <div className="flex items-center gap-2 text-yellow-500 mb-1">
              <span>🛡</span> Powered by Helius Privacy Rings
            </div>
            <div className="text-zinc-500">Encrypt. Transact. Verify.</div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeTab === "dashboard" && <DashboardView />}
          {activeTab === "send" && (
            <SendView mode={sendMode} setMode={setSendMode} />
          )}
          {activeTab === "treasury" && <TreasuryView />}
          {activeTab === "transactions" && <TransactionsView />}
          {activeTab === "settings" && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

function DashboardView() {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950">
        <div className="absolute inset-0">
          <Image
            src="/hero-ring.jpg"
            alt="VEIL ring"
            fill
            className="object-cover opacity-60"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        </div>
        <div className="relative p-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs mb-6">
            🔒 Helius Privacy Rings
          </div>
          <h1 className="text-5xl font-bold leading-tight mb-4">
            Your Business Finances Shouldn’t Be <span className="text-yellow-400">Public.</span>
          </h1>
          <p className="text-zinc-400 text-lg mb-8 max-w-md">
            Manage payroll, treasury and payments with complete privacy on Solana.
          </p>
          <button className="px-6 py-3 rounded-full bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition">
            Create Treasury →
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Team Members", value: "24", change: "+2" },
          { label: "Payroll Batches", value: "12", change: "+1" },
          { label: "Total Payments", value: "$••••••", change: "+28%" },
          { label: "Privacy Preserved", value: "100%", change: "" },
        ].map((s) => (
          <div key={s.label} className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800">
            <div className="text-2xl font-semibold">{s.value}</div>
            <div className="text-sm text-zinc-500 mt-1">{s.label}</div>
            {s.change && <div className="text-xs text-green-400 mt-2">↑ {s.change}</div>}
          </div>
        ))}
      </div>

      {/* Balance + Activity */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 p-6 rounded-2xl bg-zinc-950 border border-zinc-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Total Private Balance</h3>
            <span className="text-xs text-zinc-500">1W</span>
          </div>
          <div className="text-4xl font-bold">$24,680.50</div>
          <div className="text-sm text-green-400 mt-1">↑ +12.5% vs last week</div>
          <div className="h-32 mt-6 bg-gradient-to-t from-yellow-500/10 to-transparent rounded-xl border border-yellow-900/20 flex items-end px-4 pb-2">
            <div className="w-full h-1 bg-yellow-500/40 rounded-full relative">
              <div className="absolute right-0 -top-1 w-2 h-2 bg-yellow-400 rounded-full" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800">
          <h3 className="font-medium mb-4">Recent Activity</h3>
          <div className="space-y-4 text-sm">
            {[
              { title: "Payroll Batch Sent", sub: "3 minutes ago • 24 members", amt: "+ $••••••" },
              { title: "Payment Received", sub: "8 minutes ago • 0x7f…9a9e", amt: "+ $••••••" },
              { title: "Treasury Deposit", sub: "12 minutes ago • 1.5 SOL", amt: "+ $••••••" },
            ].map((a) => (
              <div key={a.title} className="flex justify-between items-center">
                <div>
                  <div>{a.title}</div>
                  <div className="text-xs text-zinc-500">{a.sub}</div>
                </div>
                <div className="text-green-400">{a.amt}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SendView({ mode, setMode }: { mode: string; setMode: (m: any) => void }) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold mb-6">Send</h2>
      <div className="flex gap-2 mb-8">
        {[
          { id: "single", label: "Send Payment" },
          { id: "batch", label: "Batch Payment" },
          { id: "payroll", label: "Payroll" },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`px-5 py-2 rounded-full text-sm ${
              mode === m.id ? "bg-yellow-500 text-black" : "bg-zinc-900 text-zinc-400"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "single" && (
        <div className="space-y-4">
          <input placeholder="Recipient address" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm" />
          <input placeholder="Amount (SOL or token)" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm" />
          <button className="w-full py-3 rounded-xl bg-yellow-500 text-black font-medium">Send Private Payment</button>
        </div>
      )}

      {mode === "batch" && (
        <div className="text-zinc-400">Batch payment form — multiple recipients, one confidential flow.</div>
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
    <div>
      <h2 className="text-2xl font-semibold mb-6">Treasury</h2>
      <div className="p-8 rounded-2xl bg-zinc-950 border border-zinc-800 max-w-md">
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
      <div className="text-zinc-500">Encrypted transaction history will appear here.</div>
    </div>
  );
}

function SettingsView() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Settings</h2>
      <div className="text-zinc-500">Network: Solana Devnet • Helius Privacy Rings</div>
    </div>
  );
}
