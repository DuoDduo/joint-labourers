"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

import type { PrayerHubConfig } from "@/lib/api/types";
import { activeHub, formatClock, formatDayAndZone, formatDuration, nextHandover } from "@/lib/time/hubs";

/** Live clocks for the four hubs, the hub on watch, and the countdown to the next handover. */
export function PrayerClock({ hubs, compact = false }: { hubs: PrayerHubConfig[]; compact?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return <div className={clsx("animate-pulse rounded-[var(--radius-card)] bg-brand-50", compact ? "h-20" : "h-56")} />;
  }

  const current = activeHub(hubs, now);
  const { next, msUntil } = nextHandover(hubs, now);

  if (compact) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] bg-brand-900 px-6 py-5 text-white">
        <p className="text-lg">
          <span className="mr-2 inline-block size-2.5 animate-pulse rounded-full bg-aqua align-middle" aria-hidden />
          Right now <strong className="text-aqua">{current.displayName}</strong> is on watch.
        </p>
        <p className="tabular text-brand-100">
          Next: {next.displayName} in {formatDuration(msUntil)}
        </p>
      </div>
    );
  }

  return (
    <section aria-labelledby="clock-title" className="space-y-4">
      <h2 id="clock-title" className="sr-only">
        Global prayer clock
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {hubs.map((hub) => {
          const on = hub.hub === current.hub;
          return (
            <div
              key={hub.hub}
              className={clsx(
                "rounded-[var(--radius-card)] border p-5 transition-shadow",
                on ? "border-aqua bg-brand-900 text-white shadow-[0_0_0_4px_rgb(0_204_255/0.25)]" : "border-line bg-white",
              )}
            >
              <div className="flex items-center justify-between">
                <p className={clsx("font-display text-2xl", on ? "text-white" : "text-ink-900")}>{hub.displayName}</p>
                {on && <span className="rounded-full bg-aqua px-2 py-0.5 text-xs font-bold text-brand-900">On watch</span>}
              </div>
              <p className={clsx("tabular mt-2 text-4xl font-semibold", on ? "text-white" : "text-ink-900")}>
                {formatClock(hub.timezone, now)}
              </p>
              <p className={clsx("mt-1 text-sm", on ? "text-brand-100" : "text-ink-500")}>
                {formatDayAndZone(hub.timezone, now)}
              </p>
              <p className={clsx("mt-3 text-xs", on ? "text-brand-100" : "text-ink-500")}>
                Watch {formatClock(hub.timezone, utcMinuteToday(now, hub.watchStartUtc))}–
                {formatClock(hub.timezone, utcMinuteToday(now, hub.watchEndUtc))} local
              </p>
            </div>
          );
        })}
      </div>
      <p className="tabular text-center text-sm" aria-live="off">
        The watch passes to <strong className="text-ink-900">{next.displayName}</strong> in {formatDuration(msUntil)}.
      </p>
    </section>
  );
}

function utcMinuteToday(now: Date, minute: number): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, minute % 1440));
}
