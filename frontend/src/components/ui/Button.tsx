import clsx from "clsx";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

type Variant = "accent" | "night" | "dark" | "give" | "primary" | "light" | "outline" | "outline-light" | "ghost";
type Size = "md" | "lg";

const base =
  "group inline-flex items-center justify-center gap-3 rounded-full font-semibold transition-colors " +
  "min-h-11 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, { pill: string; circle: string }> = {
  accent: { pill: "bg-aqua text-night hover:bg-aqua-200", circle: "bg-night text-white" },
  night: { pill: "bg-night text-white hover:bg-night-800", circle: "bg-aqua text-night" },
  dark: { pill: "bg-ink-900 text-white hover:bg-black", circle: "bg-white text-ink-900" },
  give: { pill: "bg-give-700 text-white hover:bg-[#a9461a]", circle: "bg-white text-give-700" },
  primary: { pill: "bg-brand text-white hover:bg-brand-700", circle: "bg-white text-brand" },
  light: { pill: "bg-white text-night hover:bg-aqua-50", circle: "bg-night text-white" },
  outline: { pill: "border-2 border-ink-900 text-ink-900 hover:bg-surface", circle: "bg-ink-900 text-white" },
  "outline-light": { pill: "border border-white/40 text-white hover:bg-white/10", circle: "bg-aqua text-night" },
  ghost: { pill: "text-ink-900 hover:bg-surface", circle: "bg-ink-900 text-white" },
};

const sizes: Record<Size, { plain: string; arrow: string; circle: string }> = {
  md: { plain: "px-5 text-sm", arrow: "pl-5 pr-1.5 text-sm", circle: "size-8" },
  lg: { plain: "px-7 text-base min-h-13", arrow: "pl-6 pr-2 text-base min-h-13", circle: "size-9" },
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string, arrow = false) {
  return clsx(base, variants[variant].pill, arrow ? sizes[size].arrow : sizes[size].plain, extra);
}

function Arrow({ variant, size }: { variant: Variant; size: Size }) {
  return (
    <span
      aria-hidden
      className={clsx(
        "flex shrink-0 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5",
        variants[variant].circle,
        sizes[size].circle,
      )}
    >
      <ArrowRight className="size-4" />
    </span>
  );
}

type Common = { variant?: Variant; size?: Size; arrow?: boolean; children?: ReactNode };

export function ButtonLink({
  variant = "primary",
  size = "md",
  arrow = false,
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & Common) {
  return (
    <Link className={buttonClass(variant, size, className, arrow)} {...props}>
      {children}
      {arrow && <Arrow variant={variant} size={size} />}
    </Link>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  arrow = false,
  className,
  children,
  ...props
}: ComponentProps<"button"> & Common) {
  return (
    <button className={buttonClass(variant, size, className, arrow)} {...props}>
      {children}
      {arrow && <Arrow variant={variant} size={size} />}
    </button>
  );
}
