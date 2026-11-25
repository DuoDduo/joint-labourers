"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

import type { PrayerHubConfig } from "@/lib/api/types";
import { activeHub, formatClock } from "@/lib/time/hubs";

/** Logo-strip style band: the four prayer hubs with live local times, scrolling gently. */
export function HubStrip({ hubs }: { hubs: PrayerHubConfig[] }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const current = now ? activeHub(hubs, now) : null;
  const items = [...hubs, ...hubs, ...hubs];

  return (
    <section aria-label="Prayer hubs, live" className="relative overflow-hidden border-b border-line py-7">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white" aria-hidden />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white" aria-hidden />
      <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-14 pr-14 motion-reduce:animate-none">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex gap-14" aria-hidden={copy === 1}>
            {items.map((hub, i) => {
              const on = current?.hub === hub.hub;
              return (
                <div key={`${hub.hub}-${i}`} className="flex items-center gap-3 whitespace-nowrap">
                  <span className={clsx("size-2.5 rounded-full", on ? "animate-pulse bg-aqua" : "bg-line")} aria-hidden />
                  <span className={clsx("font-display text-2xl font-semibold", on ? "text-night" : "text-ink-500")}>
                    {hub.displayName}
                  </span>
                  <span className="tabular text-lg text-ink-500">{now ? formatClock(hub.timezone, now) : "--:--"}</span>
                  {on && <span className="rounded-full bg-aqua px-2 py-0.5 text-xs font-bold text-night">On watch</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
