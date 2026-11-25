"use client";

import Image from "next/image";

type Props = {
  onCreate: () => void;
  onSend: () => void;
  onPayroll: () => void;
  onTreasury: () => void;
};

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg
      className="w-[22px] h-[22px]"
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

const tiles = [
  { key: "send", label: "Send", icon: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" /> },
  {
    key: "payroll",
    label: "Payroll",
    icon: (
      <>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 5.5a3 3 0 0 1 0 5.8M18.5 14.4c1.6.8 2.5 2.4 2.5 4.6" />
      </>
    ),
  },
  { key: "treasury", label: "Treasury", icon: <path d="M3 10l9-6 9 6M5 10v9m4-9v9m6-9v9m4-9v9M3 21h18" /> },
] as const;

export default function Hero({ onCreate, onSend, onPayroll, onTreasury }: Props) {
  const handlers = { send: onSend, payroll: onPayroll, treasury: onTreasury };

  return (
    <section className="hero card" aria-label="VEIL">
      <div className="hero-media" aria-hidden="true">
        <Image
          src="/hero-ring.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 512px) 100vw, 480px"
          className="hero-ring"
        />
      </div>
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-fade" aria-hidden="true" />

      <div className="relative z-10 flex h-full flex-col justify-between p-5">
        <span className="glass-pill self-start">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" />
          </svg>
          Privacy Rings
        </span>

        <div>
          <h1 className="hero-title">
            Finance,
            <br />
            <span className="gold-text">veiled.</span>
          </h1>

          <button onClick={onCreate} className="btn btn-glass-gold w-full mt-5 py-3.5 rounded-2xl text-[0.95rem]">
            Create Treasury
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14m0 0-5-5m5 5-5 5" />
            </svg>
          </button>

          <div className="grid grid-cols-3 gap-2.5 mt-3">
            {tiles.map((t) => (
              <button key={t.key} onClick={handlers[t.key]} className="tile">
                <Svg>{t.icon}</Svg>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
