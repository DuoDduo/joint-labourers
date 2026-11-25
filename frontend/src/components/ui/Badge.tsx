import clsx from "clsx";
import type { ReactNode } from "react";

const tones = {
  brand: "border-ink-900/15 text-ink-900",
  give: "border-give-700/40 bg-give-50 text-give-700",
  gold: "border-gold bg-gold-50 text-ink-900",
  neutral: "border-line text-ink-600",
} as const;

export function Badge({ tone = "brand", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}
