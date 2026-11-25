"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-300 to-yellow-600" aria-hidden="true" />
      <p className="text-zinc-400 text-sm">Something slipped.</p>
      <button onClick={reset} className="btn btn-glass-gold px-6 py-3 rounded-2xl">
        Try again
      </button>
    </div>
  );
}
