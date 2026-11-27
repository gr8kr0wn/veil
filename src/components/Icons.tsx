import type { ReactNode } from "react";

function Svg({ children, size = 22 }: { children: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const I = {
  home: (s?: number) => (
    <Svg size={s}>
      <path d="M4 11 12 4l8 7M6 9.5V20h12V9.5" />
      <path d="M10 20v-5h4v5" />
    </Svg>
  ),
  vault: (s?: number) => (
    <Svg size={s}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 8.8V7M12 17v-1.8M8.8 12H7M17 12h-1.8" />
    </Svg>
  ),
  send: (s?: number) => (
    <Svg size={s}>
      <path d="M5 19 19 5M9 5h10v10" />
    </Svg>
  ),
  activity: (s?: number) => (
    <Svg size={s}>
      <path d="M3 12h4l2.5-6 5 12 2.5-6H21" />
    </Svg>
  ),
  account: (s?: number) => (
    <Svg size={s}>
      <circle cx="12" cy="9" r="3.4" />
      <path d="M5 20c.8-3.6 3.6-5.4 7-5.4s6.2 1.8 7 5.4" />
    </Svg>
  ),
  eye: (s?: number) => (
    <Svg size={s}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </Svg>
  ),
  eyeOff: (s?: number) => (
    <Svg size={s}>
      <path d="M3 3l18 18M9.9 5.7A9 9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.8M6.3 7.3A16 16 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4-.9" />
      <path d="M10 10a2.6 2.6 0 0 0 3.6 3.6" />
    </Svg>
  ),
  plus: (s?: number) => (
    <Svg size={s}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  ),
  down: (s?: number) => (
    <Svg size={s}>
      <path d="M12 4v14m0 0-5-5m5 5 5-5M5 21h14" />
    </Svg>
  ),
  up: (s?: number) => (
    <Svg size={s}>
      <path d="M12 20V6m0 0-5 5m5-5 5 5M5 3h14" />
    </Svg>
  ),
  copy: (s?: number) => (
    <Svg size={s}>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
      <path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
    </Svg>
  ),
  close: (s?: number) => (
    <Svg size={s}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  ),
  lock: (s?: number) => (
    <Svg size={s}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </Svg>
  ),
  ring: (s?: number) => (
    <Svg size={s}>
      <ellipse cx="12" cy="12" rx="8" ry="5.5" transform="rotate(-24 12 12)" />
      <ellipse cx="12" cy="12" rx="4.6" ry="2.7" transform="rotate(-24 12 12)" />
    </Svg>
  ),
};
