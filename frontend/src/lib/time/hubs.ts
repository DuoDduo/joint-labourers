import type { PrayerHub, PrayerHubConfig } from "@/lib/api/types";

/** Fallback when the API is unreachable. Mirrors backend DEFAULT_HUBS (relay order). */
export const DEFAULT_HUBS: PrayerHubConfig[] = [
  { hub: "SYDNEY", displayName: "Sydney", timezone: "Australia/Sydney", watchStartUtc: 0, watchEndUtc: 360 },
  { hub: "LAGOS", displayName: "Lagos", timezone: "Africa/Lagos", watchStartUtc: 360, watchEndUtc: 720 },
  { hub: "NEW_YORK", displayName: "New York", timezone: "America/New_York", watchStartUtc: 720, watchEndUtc: 1080 },
  { hub: "VANCOUVER", displayName: "Vancouver", timezone: "America/Vancouver", watchStartUtc: 1080, watchEndUtc: 1440 },
];

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function minuteOfDayUtc(d: Date): number {
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

export function activeHub(hubs: PrayerHubConfig[], now: Date): PrayerHubConfig {
  const m = minuteOfDayUtc(now);
  return hubs.find((h) => h.watchStartUtc <= m && m < h.watchEndUtc) ?? hubs[0]!;
}

export function nextHandover(
  hubs: PrayerHubConfig[],
  now: Date,
): { next: PrayerHubConfig; msUntil: number } {
  const sorted = [...hubs].sort((a, b) => a.watchStartUtc - b.watchStartUtc);
  const current = activeHub(sorted, now);
  const next = sorted[(sorted.indexOf(current) + 1) % sorted.length]!;
  const msUntil = (current.watchEndUtc - minuteOfDayUtc(now)) * 60_000 - now.getUTCSeconds() * 1000;
  return { next, msUntil };
}

export function formatClock(tz: string, now: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
}

export function formatDayAndZone(tz: string, now: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    weekday: "short",
    timeZoneName: "short",
  }).format(now);
}

/** Local (weekday 0=Sun, hour) in `tz` for an instant. */
export function localSlot(tz: string, at: Date): { weekday: number; hour: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const hr = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  return { weekday: WEEKDAY_INDEX[wd] ?? 0, hour: hr % 24 };
}

/** Convert a UTC weekly cell to local weekday/hour in `tz`, using the current week. */
export function utcCellToLocal(weekdayUtc: number, hourUtc: number, tz: string, ref = new Date()) {
  const base = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate()));
  const shift = (weekdayUtc - base.getUTCDay() + 7) % 7;
  const at = new Date(base.getTime() + shift * 86_400_000 + hourUtc * 3_600_000);
  return localSlot(tz, at);
}

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Lagos";
  } catch {
    return "Africa/Lagos";
  }
}

export function hubForZone(tz: string, hubs: PrayerHubConfig[]): PrayerHub {
  return hubs.find((h) => h.timezone === tz)?.hub ?? "LAGOS";
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
