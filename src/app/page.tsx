import Image from "next/image";
import Link from "next/link";
import Pane from "@/components/Pane";
import { I } from "@/components/Icons";

export default function Landing() {
  return (
    <div className="relative isolate overflow-x-clip">
      <div className="stage" />

      {/* ---------- hero: the vault is the stage ---------- */}
      <section className="relative min-h-[100svh] flex flex-col">
        <header className="relative z-20 flex items-center justify-between px-5 md:px-10 py-5">
          <span className="wordmark text-lg">VEIL</span>
          <Link href="/app" className="btn btn-glass !py-2.5 !px-5 !text-sm">Open app</Link>
        </header>

        <div className="pointer-events-none absolute right-[-28%] top-[6svh] w-[118%] md:right-[-4%] md:top-[2svh] md:w-[56%] max-w-[860px]">
          <Image src="/vault.webp" alt="" width={900} height={1023} priority className="vault-mask arrive drift w-full h-auto" />
        </div>

        <div className="relative z-10 mt-auto px-5 md:px-10 pb-14 md:pb-20 pt-[52svh] md:pt-0">
          <h1 className="wordmark text-[clamp(4.6rem,24vw,13rem)] leading-[0.82] -ml-1 md:-ml-3">VEIL</h1>
          <div className="mt-7 md:mt-9 flex flex-col md:flex-row md:items-end gap-6 md:gap-14">
            <p className="display text-[clamp(1.15rem,2.4vw,1.7rem)] leading-snug max-w-[17ch] md:max-w-[20ch] text-bone">
              Send money. Keep the amount to yourselves.
            </p>
            <div className="flex items-center gap-3">
              <Link href="/app" className="btn btn-gold">Open Veil</Link>
              <span className="flex items-center gap-2 text-sm text-dim"><span className="live-dot" /> Live on Solana</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- what the chain sees ---------- */}
      <section className="relative px-5 md:px-10 py-24 md:py-40">
        <div className="pointer-events-none absolute -left-[35%] md:-left-[8%] top-6 w-[110%] md:w-[52%] max-w-[760px]">
          <Image src="/ring.webp" alt="" width={1100} height={1100} className="ring-mask w-full h-auto opacity-90" />
        </div>
        <div className="relative md:ml-auto md:w-[46%] pt-[54vw] md:pt-16">
          <Pane className="p-6 md:p-8">
            <div className="flex items-center gap-2.5 text-gold-hi">
              {I.ring(20)}
              <span className="display text-base">Private transfer</span>
            </div>
            <dl className="mt-7 divide-y divide-[rgba(255,214,120,0.09)] text-[15px]">
              {[
                ["Amount", 7],
                ["Asset", 4],
                ["Note", 9],
              ].map(([k, w]) => (
                <div key={k as string} className="flex items-center justify-between py-4">
                  <dt className="text-dim">{k}</dt>
                  <dd><span className="redact" style={{ width: `${(w as number) * 11}px` }} /></dd>
                </div>
              ))}
              {[
                ["From", "7xKp…2mQ4"],
                ["To", "3XEm…CMgn"],
                ["Transaction", "5k9d…hQ2w"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-4">
                  <dt className="text-dim">{k}</dt>
                  <dd className="font-mono text-sm text-bone/90">{v}</dd>
                </div>
              ))}
            </dl>
          </Pane>
          <p className="mt-6 max-w-[30ch] text-dim leading-relaxed">
            What was paid stays sealed. That it happened stays on the record.
          </p>
        </div>
      </section>

      {/* ---------- ways to pay ---------- */}
      <section className="relative px-5 md:px-10 pb-24 md:pb-40">
        <h2 className="display text-[clamp(1.6rem,4vw,3rem)] leading-tight max-w-[14ch]">Pay one person or a whole team.</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-12 md:items-stretch">
          <Pane className="md:col-span-7 p-7 md:p-10 min-h-[260px] flex flex-col justify-between">
            <svg viewBox="0 0 260 60" className="w-full max-w-[320px] text-gold" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <circle cx="14" cy="30" r="10" />
              <path d="M24 30h196" strokeDasharray="3 6" />
              <path d="M212 22l10 8-10 8" />
              <circle cx="244" cy="30" r="10" />
            </svg>
            <div>
              <h3 className="display text-2xl">Payment</h3>
              <p className="mt-2 text-dim">One recipient, one private amount.</p>
            </div>
          </Pane>
          <div className="md:col-span-5 grid gap-4">
            <Pane className="p-7 flex items-center justify-between gap-6">
              <div>
                <h3 className="display text-xl">Batch</h3>
                <p className="mt-1.5 text-dim text-sm">Up to 15 recipients.</p>
              </div>
              <svg viewBox="0 0 90 60" className="w-24 text-gold shrink-0" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                <circle cx="8" cy="30" r="5" />
                {[8, 30, 52].map((y) => (<g key={y}><path d={`M13 30C40 30 50 ${y} 74 ${y}`} /><circle cx="80" cy={y} r="4" /></g>))}
              </svg>
            </Pane>
            <Pane className="p-7 flex items-center justify-between gap-6">
              <div>
                <h3 className="display text-xl">Payroll</h3>
                <p className="mt-1.5 text-dim text-sm">Salaries nobody else can read.</p>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0" aria-hidden="true">
                {[56, 40, 64].map((w) => (<span key={w} className="redact !h-[9px]" style={{ width: w }} />))}
              </div>
            </Pane>
          </div>
        </div>
      </section>

      {/* ---------- close ---------- */}
      <section className="relative px-5 md:px-10 pb-16 md:pb-24">
        <Pane className="relative overflow-hidden p-8 md:p-14">
          <div className="pointer-events-none absolute -right-[18%] -top-[30%] w-[70%] md:w-[44%] opacity-80">
            <Image src="/ring.webp" alt="" width={1100} height={1100} className="ring-mask w-full h-auto" />
          </div>
          <h2 className="display relative text-[clamp(1.6rem,4vw,3rem)] leading-tight max-w-[12ch]">Your balance is your business.</h2>
          <Link href="/app" className="btn btn-gold relative mt-9">Open Veil</Link>
        </Pane>
        <p className="mt-10 text-sm text-faint">Built on Helius Privacy Rings, on Solana.</p>
      </section>
    </div>
  );
}
