import type { Metadata } from "next";
import Image from "next/image";

import { ScriptureCard } from "@/components/illustrations/ScriptureCard";
import { Eyebrow, PageIntro, TopPanel } from "@/components/layout/TopPanel";
import { PrayerClock } from "@/components/prayer/PrayerClock";
import { PrayerGrid } from "@/components/prayer/PrayerGrid";
import { WatchCard } from "@/components/prayer/WatchCard";
import { ButtonLink } from "@/components/ui/Button";
import { illustration } from "@/config/illustrations";
import { apiGet } from "@/lib/api/client";
import type { CoverageCell, PrayerHubConfig, WatchSummary } from "@/lib/api/types";
import { DEFAULT_HUBS } from "@/lib/time/hubs";

export const metadata: Metadata = {
  title: "Prayer network",
  description: "A 24-hour prayer relay across Sydney, Lagos, New York and Vancouver. Claim a weekly hour in your own time zone.",
};

export const revalidate = 60;

export default async function PrayPage() {
  const [hubs, coverage, watches] = await Promise.all([
    apiGet<PrayerHubConfig[]>("/prayer/hubs", { revalidate: 3600 }).catch(() => DEFAULT_HUBS),
    apiGet<CoverageCell[]>("/prayer/coverage", { revalidate: 60 }).catch(() => []),
    apiGet<WatchSummary[]>("/prayer/watches", { revalidate: 60 }).catch(() => [] as WatchSummary[]),
  ]);

  return (
    <>
      <TopPanel>
        <PageIntro
          eyebrow="Prayer network"
          title="One watch, four cities, twenty-four hours"
          aside={
            <Image
              src="/images/illustrations/isaiah-62-6.jpg"
              alt={illustration("isaiah-62-6.jpg").alt}
              width={1080}
              height={1080}
              sizes="288px"
              priority
              className="hidden h-auto w-72 rounded-2xl lg:block"
            />
          }
        >
          <p>
            Each hub prays through its own daytime, then passes the watch on: Sydney to Lagos to New York to Vancouver,
            and around again. No giving or act of service is complete without a commitment to pray.
          </p>
          <blockquote className="mt-5 border-l-2 border-aqua pl-4 text-base text-white">
            “I have set watchmen upon thy walls… which shall never hold their peace day nor night.”
            <span className="mt-1 block text-sm text-white/60">Isaiah 62:6</span>
          </blockquote>
        </PageIntro>
      </TopPanel>

      <div className="wrap space-y-16 py-12">
        <PrayerClock hubs={hubs} />

        {watches.length > 0 && (
          <section aria-labelledby="watches-title" className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-3">
                <Eyebrow>Prayer watches</Eyebrow>
                <h2 id="watches-title" className="text-3xl sm:text-4xl">
                  Reserve your <em>shift on the wall</em>
                </h2>
              </div>
              <ButtonLink href="/pray/watches" variant="outline" arrow>
                All watches
              </ButtonLink>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {watches.slice(0, 2).map((w) => (
                <WatchCard key={w.slug} watch={w} />
              ))}
            </div>
          </section>
        )}

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
