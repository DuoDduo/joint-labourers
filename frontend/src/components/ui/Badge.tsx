import clsx from "clsx";
import type { ReactNode } from "react";

const tones = {
  brand: "bg-brand-50 text-brand-700",
  give: "bg-give-50 text-give-700",
  gold: "bg-gold-50 text-ink-900",
  neutral: "bg-surface text-ink-600",
} as const;

export function Badge({ tone = "brand", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}
