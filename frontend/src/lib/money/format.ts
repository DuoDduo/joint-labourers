import type { Currency } from "@/lib/api/types";

const LOCALE: Record<Currency, string> = {
  NGN: "en-NG",
  USD: "en-US",
  GBP: "en-GB",
  EUR: "en-IE",
  CAD: "en-CA",
  AUD: "en-AU",
  KES: "en-KE",
};

/** Format an amount given in minor units (string or bigint). Whole units, no decimals. */
export function formatMinor(minor: string | bigint, currency: Currency): string {
  const major = BigInt(minor) / 100n;
  return new Intl.NumberFormat(LOCALE[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(major));
}

export function remainingMinor(targetMinor: string, raisedMinor: string): bigint {
  const r = BigInt(targetMinor) - BigInt(raisedMinor);
  return r > 0n ? r : 0n;
}

export function daysLeft(deadline: string | null, now = new Date()): number | null {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - now.getTime();
  return Math.ceil(ms / 86_400_000);
}
