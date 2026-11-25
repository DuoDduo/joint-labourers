import type { Metadata } from "next";
import Image from "next/image";

import { ScriptureCard } from "@/components/illustrations/ScriptureCard";
import { PrayerClock } from "@/components/prayer/PrayerClock";
import { PrayerGrid } from "@/components/prayer/PrayerGrid";
import { illustration } from "@/config/illustrations";
import { apiGet } from "@/lib/api/client";
import type { CoverageCell, PrayerHubConfig } from "@/lib/api/types";
import { DEFAULT_HUBS } from "@/lib/time/hubs";

export const metadata: Metadata = {
  title: "Prayer network",
  description: "A 24-hour prayer relay across Sydney, Lagos, New York and Vancouver. Claim a weekly hour in your own time zone.",
};

export const revalidate = 60;

export default async function PrayPage() {
  const [hubs, coverage] = await Promise.all([
    apiGet<PrayerHubConfig[]>("/prayer/hubs", { revalidate: 3600 }).catch(() => DEFAULT_HUBS),
    apiGet<CoverageCell[]>("/prayer/coverage", { revalidate: 60 }).catch(() => []),
  ]);

  return (
    <>
      <section className="bg-brand-900 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <p className="text-sm font-semibold tracking-widest text-aqua uppercase">Prayer network</p>
            <h1 className="text-5xl font-semibold text-white">One watch, four cities, twenty-four hours</h1>
            <p className="max-w-xl text-lg text-brand-100">
              Each hub prays through its own daytime, then passes the watch on: Sydney to Lagos to New York to Vancouver,
              and around again. No giving or act of service is complete without a commitment to pray.
            </p>
            <blockquote className="font-display text-xl text-white italic">
              “I have set watchmen upon thy walls… which shall never hold their peace day nor night.”
              <span className="mt-1 block font-sans text-sm text-brand-200 not-italic">Isaiah 62:6</span>
            </blockquote>
          </div>
          <Image
            src="/images/illustrations/isaiah-62-6.jpg"
            alt={illustration("isaiah-62-6.jpg").alt}
            width={1080}
            height={1080}
            sizes="360px"
            priority
            className="h-auto w-full rounded-2xl"
          />
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-4 py-12">
        <PrayerClock hubs={hubs} />
        <PrayerGrid hubs={hubs} coverage={coverage} />

        <section aria-labelledby="watch-title" className="grid gap-8 md:grid-cols-[1fr_1fr_1fr]">
          <div className="space-y-3 md:col-span-1">
            <h2 id="watch-title" className="text-3xl">Arise, watch and pray</h2>
            <p>
              Times follow each city's own clock, including summer time where it applies, so your hour stays the same on your
              watch all year.
            </p>
          </div>
          <ScriptureCard item={illustration("matthew-26-41-watch.jpg")} sizes="(min-width: 768px) 360px, 100vw" />
          <ScriptureCard item={illustration("isaiah-59-15.jpg")} sizes="(min-width: 768px) 360px, 100vw" />
        </section>
      </div>
    </>
  );
}
