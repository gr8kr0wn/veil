"use client";

import { I } from "@/components/Icons";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="grid place-items-center w-16 h-16 rounded-full text-gold" style={{ boxShadow: "0 0 0 1px rgba(255,217,138,0.4) inset, 0 0 40px -8px rgba(232,169,58,0.6)" }}>
        {I.ring(30)}
      </span>
      <p className="text-dim">Something went wrong on our side.</p>
      <button onClick={reset} className="btn btn-gold">Try again</button>
    </div>
  );
}
