"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAppConfig } from "./Providers";
import { NETWORK_LABEL } from "@/lib/config";
import { useVeil } from "@/lib/use-veil";
import { Dock, Rail, type Tab } from "./Nav";
import Sheet, { Modal } from "./Sheet";
import { HomeView, TreasuryView, SendView, ActivityView, type SendMode } from "./Views";

const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;

export default function AppShell() {
  const { setVisible: openWalletModal } = useWalletModal();
  const { disconnect } = useWallet();
  const { heliusEnabled } = useAppConfig();
  const veil = useVeil();
  const { connected, owner } = veil;
  const [tab, setTab] = useState<Tab>("home");
  const [sendMode, setSendMode] = useState<SendMode>("single");
  const [hide, setHide] = useState(true);
  const [sheet, setSheet] = useState<"deposit" | "withdraw" | "account" | null>(null);

  /** Connect -> unlock -> register, whichever step is next. */
  async function createTreasury() {
    if (!connected) return openWalletModal(true);
    if (await veil.createTreasury()) setTab("treasury");
  }
  function openSheet(kind: "deposit" | "withdraw") {
    veil.clearError();
    if (!connected) return openWalletModal(true);
    if (!veil.ready) return void veil.unlock();
    setSheet(kind);
  }

  /* ---------- start screen ---------- */
  if (!connected) {
    return (
      <div className="relative isolate min-h-[100svh] overflow-hidden flex flex-col">
        <div className="stage" />
        <header className="relative z-10 flex items-center justify-between px-5 md:px-10 py-5">
          <Link href="/" className="wordmark text-lg">VEIL</Link>
          <span className="flex items-center gap-2 text-xs text-dim"><span className="live-dot" />{NETWORK_LABEL}</span>
        </header>
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-[4%] top-[8svh] w-[120%] md:w-[48%] max-w-[760px]">
          <Image src="/vault.webp" alt="" width={900} height={1023} priority className="vault-mask arrive drift w-full h-auto" />
        </div>
        <div className="relative z-10 mt-auto px-5 md:px-10 pb-12 md:pb-20 max-w-xl">
          <h1 className="display text-[clamp(2rem,6vw,3.6rem)] leading-[1.05]">Open your vault.</h1>
          <button onClick={() => openWalletModal(true)} className="btn btn-gold mt-8 w-full md:w-auto md:px-10">Connect wallet</button>
          <p className="mt-5 text-sm text-dim">Phantom, Solflare or Jupiter. Nothing leaves your wallet without your approval.</p>
        </div>
      </div>
    );
  }

  const go = (t: Tab) => setTab(t);
  const goSend = (m: SendMode) => { setSendMode(m); setTab("send"); };

  return (
    <div className="relative isolate min-h-[100svh]">
      <div className="stage" />
      <div className="pointer-events-none fixed right-[-12%] top-[6svh] w-[46%] max-w-[700px] hidden md:block opacity-60">
        <Image src="/vault.webp" alt="" width={900} height={1023} className="vault-mask w-full h-auto" />
      </div>

      <header className="sticky top-0 z-40 flex items-center justify-between px-5 md:px-10 py-4">
        <Link href="/" className="wordmark text-base">VEIL</Link>
        <div className="flex items-center gap-2.5">
          <span className="hidden sm:flex items-center gap-2 text-xs text-dim"><span className="live-dot" />{NETWORK_LABEL}</span>
          <button onClick={() => setSheet("account")} className="btn btn-glass !py-2 !px-3.5 !text-[13px] font-mono" aria-label="Account">
            {owner ? short(owner) : "Wallet"}
          </button>
        </div>
      </header>

      <main className="px-5 md:pl-28 md:pr-10 pt-2 pb-36 md:pb-16">
        <div key={tab} className="view-enter max-w-xl mx-auto md:mx-0 md:ml-[max(0px,calc(50vw-420px))]">
          {tab === "home" && (
            <HomeView veil={veil} hide={hide} setHide={setHide} heliusEnabled={heliusEnabled}
              onDeposit={() => openSheet("deposit")} onWithdraw={() => openSheet("withdraw")}
              onSetup={createTreasury} onActivity={() => go("activity")} onPayroll={() => goSend("payroll")} />
          )}
          {tab === "treasury" && (
            <TreasuryView veil={veil} hide={hide} setHide={setHide} onDeposit={() => openSheet("deposit")}
              onWithdraw={() => openSheet("withdraw")} onSetup={createTreasury} />
          )}
          {tab === "send" && <SendView veil={veil} mode={sendMode} setMode={setSendMode} />}
          {tab === "activity" && <ActivityView history={veil.history} onSend={() => goSend("single")} />}
        </div>
      </main>

      <Dock active={tab} onTab={go} onAccount={() => setSheet("account")} />
      <Rail active={tab} onTab={go} onAccount={() => setSheet("account")} />

      <Sheet open={sheet === "deposit"} title="Deposit" cta="Deposit" note="The deposit amount is public. Everything after it can stay private."
        busy={veil.busy !== null} error={veil.error} onClose={() => setSheet(null)} onSubmit={(_, a) => veil.deposit(a)} />
      <Sheet open={sheet === "withdraw"} title="Withdraw" cta="Withdraw" address={{ label: "To address", initial: owner ?? "" }}
        note="Withdrawals are public. The address and amount can be seen."
        busy={veil.busy !== null} error={veil.error} onClose={() => setSheet(null)} onSubmit={(to, a) => veil.withdraw(to, a)} />
      {sheet === "account" && (
        <AccountSheet owner={owner} hide={hide} setHide={setHide} heliusEnabled={heliusEnabled}
          onClose={() => setSheet(null)} onDisconnect={() => { setSheet(null); void disconnect(); }} />
      )}
    </div>
  );
}

function AccountSheet({ owner, hide, setHide, heliusEnabled, onClose, onDisconnect }: {
  owner: string | null; hide: boolean; setHide: (v: boolean) => void; heliusEnabled: boolean; onClose: () => void; onDisconnect: () => void;
}) {
  const rows: [string, string][] = [
    ["Network", `Solana ${NETWORK_LABEL}`],
    ["Privacy", "Helius Privacy Rings"],
    ["Connection", heliusEnabled ? "Helius" : "Public RPC"],
  ];
  return (
    <Modal title="Account" onClose={onClose}>
      {owner && <p className="font-mono text-xs break-all text-bone/90">{owner}</p>}
      <dl className="divide-y divide-[rgba(255,214,120,0.09)] text-[15px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between py-3.5"><dt className="text-dim">{k}</dt><dd>{v}</dd></div>
        ))}
        <div className="flex items-center justify-between py-3.5">
          <dt className="text-dim">Hide balances</dt>
          <dd>
            <button role="switch" aria-checked={hide} aria-label="Hide balances" onClick={() => setHide(!hide)}
              className="relative w-12 h-7 rounded-full transition-colors" style={{ background: hide ? "linear-gradient(180deg,#ffe3a3,#c4781f)" : "rgba(255,226,160,0.12)" }}>
              <span className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-ink transition-transform duration-300" style={{ transform: hide ? "translateX(20px)" : "none" }} />
            </button>
          </dd>
        </div>
      </dl>
      <button onClick={onDisconnect} className="btn btn-glass w-full">Disconnect</button>
    </Modal>
  );
}
