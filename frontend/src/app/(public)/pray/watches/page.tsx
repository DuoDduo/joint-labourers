import type { Metadata } from "next";

import { PageIntro, TopPanel } from "@/components/layout/TopPanel";
import { WatchCard } from "@/components/prayer/WatchCard";
import { apiGet } from "@/lib/api/client";
import type { WatchSummary } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Prayer watches",
  description: "Reserve a shift in JLICI's prayer watches: the quarterly 24-hour cycle and seasons of prayer and fasting.",
};

export const revalidate = 60;

export default async function WatchesPage() {
  const watches = await apiGet<WatchSummary[]>("/prayer/watches").catch(() => []);
  return (
    <>
      <TopPanel>
        <PageIntro eyebrow="Prayer watches" title={<>Reserve your <em>place on the wall</em></>}>
          <p>Choose a watch, then pick your shift. Together we keep prayer going around the clock and around the world.</p>
        </PageIntro>
      </TopPanel>
      <div className="wrap py-14">
        {watches.length ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {watches.map((w) => (
              <WatchCard key={w.slug} watch={w} />
            ))}
          </div>
        ) : (
          <p className="rounded-[var(--radius-card)] bg-surface p-10 text-center">No prayer watches are open right now.</p>
        )}
      </div>
    </>
  );
}
