"use client";

import { I } from "./Icons";

export type Tab = "home" | "treasury" | "send" | "activity";
type Slot = { id: Tab | "account"; label: string };

const SLOTS: Slot[] = [
  { id: "home", label: "Home" },
  { id: "treasury", label: "Treasury" },
  { id: "send", label: "Send" },
  { id: "activity", label: "Activity" },
  { id: "account", label: "Account" },
];

const icon = (id: Slot["id"], size?: number) =>
  id === "home" ? I.home(size) : id === "treasury" ? I.vault(size) : id === "send" ? I.send(size) : id === "activity" ? I.activity(size) : I.account(size);

type Props = { active: Tab; onTab: (t: Tab) => void; onAccount: () => void };

/** Floating glass dock (phones). */
export function Dock({ active, onTab, onAccount }: Props) {
  const idx = SLOTS.findIndex((s) => s.id === active);
  return (
    <nav className="dock md:hidden" aria-label="Main">
      <div className="dock-grid">
        <span className="dock-streak" style={{ ["--i" as string]: idx }} aria-hidden="true" />
        {SLOTS.map((s) => {
          const cur = s.id === active ? "page" : undefined;
          const click = () => (s.id === "account" ? onAccount() : onTab(s.id));
          if (s.id === "send") {
            return (
              <button key={s.id} onClick={click} aria-current={cur} aria-label="Send" className="send-ring mx-auto">
                {I.send(26)}
              </button>
            );
          }
          return (
            <button key={s.id} onClick={click} aria-current={cur} className="dock-item">
              <span className="dock-ico">{icon(s.id, 21)}</span>
              {s.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/** Slim glass rail (laptops). Expands on hover. */
export function Rail({ active, onTab, onAccount }: Props) {
  const order: Slot[] = [SLOTS[2], SLOTS[0], SLOTS[1], SLOTS[3], SLOTS[4]];
  return (
    <nav className="rail hidden md:block" aria-label="Main">
      <div className="flex flex-col gap-1">
        {order.map((s) => {
          const cur = s.id === active ? "page" : undefined;
          const click = () => (s.id === "account" ? onAccount() : onTab(s.id));
          if (s.id === "send") {
            return (
              <button key={s.id} onClick={click} aria-current={cur} className="rail-item mb-2 !px-0">
                <span className="send-ring" aria-hidden="true">{I.send(22)}</span>
                <span className={`rail-label ${cur ? "text-gold-hi" : "text-bone"}`}>Send</span>
              </button>
            );
          }
          return (
            <button key={s.id} onClick={click} aria-current={cur} className="rail-item">
              <span className="dock-ico">{icon(s.id, 21)}</span>
              <span className="rail-label">{s.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
