"use client";

import type { CSSProperties, ElementType, ReactNode } from "react";

/** Black glass panel. Its rim light follows the pointer or finger. */
export default function Pane({
  as: Tag = "div",
  className = "",
  style,
  children,
}: {
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <Tag
      className={`pane ${className}`}
      style={style}
      onPointerMove={(e: React.PointerEvent<HTMLElement>) => {
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      onPointerLeave={(e: React.PointerEvent<HTMLElement>) => {
        e.currentTarget.style.removeProperty("--mx");
        e.currentTarget.style.removeProperty("--my");
      }}
    >
      {children}
    </Tag>
  );
}
