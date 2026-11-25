import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "give" | "primary" | "outline" | "ghost";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors " +
  "min-h-11 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  give: "bg-give-700 text-white hover:bg-[#a9461a]",
  primary: "bg-brand text-white hover:bg-brand-700",
  outline: "border-2 border-brand text-brand hover:bg-brand-50",
  ghost: "text-brand hover:bg-brand-50",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-2 text-sm",
  lg: "px-7 py-3 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return clsx(base, variants[variant], sizes[size], extra);
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}
