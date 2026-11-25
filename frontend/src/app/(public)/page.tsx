import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ScriptureCard } from "@/components/illustrations/ScriptureCard";
import { NeedCard } from "@/components/needs/NeedCard";
import { PrayerClock } from "@/components/prayer/PrayerClock";
import { ButtonLink } from "@/components/ui/Button";
import { illustration } from "@/config/illustrations";
import { apiGet } from "@/lib/api/client";
import type { ImpactStats, NeedCard as Need, Page, PrayerHubConfig } from "@/lib/api/types";
import { DEFAULT_HUBS } from "@/lib/time/hubs";

export const revalidate = 60;

const PATHWAYS = [
  { title: "Stand in the gap", text: "Claim a weekly prayer hour in your time zone.", href: "/pray", art: "isaiah-62-6.jpg", cta: "Pray with us" },
  { title: "Fund a need", text: "Give toward a real, checked need until it is met.", href: "/needs", art: "philippians-2-25.jpg", cta: "See needs" },
  { title: "Adopt a missionary", text: "Monthly care for a labourer and their family.", href: "/give", art: "ecclesiastes-3-1.jpg", cta: "Partner monthly" },
  { title: "Open your home", text: "Host labourers passing through your city.", href: "/needs", art: "acts-6-3.jpg", cta: "Coming soon", soon: true },
];

export default async function HomePage() {
  const [stats, needs, hubs] = await Promise.all([
    apiGet<ImpactStats>("/stats/impact").catch(() => null),
    apiGet<Page<Need>>("/needs?sort=progress&pageSize=3", { tags: ["needs:list"] }).catch(() => null),
    apiGet<PrayerHubConfig[]>("/prayer/hubs", { revalidate: 3600 }).catch(() => DEFAULT_HUBS),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div className="space-y-6">
            <p className="text-sm font-semibold tracking-widest text-brand uppercase">Joint Labourers In Christ Int'l</p>
            <h1 className="text-5xl leading-[1.05] font-semibold sm:text-6xl">Equipping the saints together for souls</h1>
            <p className="max-w-xl text-lg">
              Frontline missionaries serve in hard places with no salary and no safety net. Pray for them, meet their
              real needs, and labour alongside them.
            </p>
            <blockquote className="border-l-4 border-aqua pl-4 font-display text-xl text-ink-900 italic">
              “…and many others, which ministered unto him of their substance.”
              <span className="mt-1 block font-sans text-sm font-semibold text-ink-500 not-italic">Luke 8:3</span>
            </blockquote>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/needs" variant="give" size="lg">
                Fund a need
              </ButtonLink>
              <ButtonLink href="/pray" variant="outline" size="lg">
                Claim a prayer hour
              </ButtonLink>
            </div>
          </div>
          <div className="relative">
            <Image
              src="/images/illustrations/luke-8-3.jpg"
              alt={illustration("luke-8-3.jpg").alt}
              width={1080}
              height={1080}
              priority
              sizes="(min-width: 1024px) 520px, 100vw"
              className="h-auto w-full rounded-2xl shadow-[var(--shadow-card)]"
            />
          </div>
        </div>
      </section>

      {/* Impact */}
      {stats && (
        <section aria-label="Impact" className="mx-auto max-w-6xl px-4">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line lg:grid-cols-4">
            {[
              [stats.missionariesSupported, "missionaries supported"],
              [`${stats.needsMetThisYear} of ${stats.needsTotalThisYear}`, "needs met this year"],
              [`${stats.prayerHoursCovered}/168`, "weekly prayer hours covered"],
              [stats.territories, "regions reached"],
            ].map(([value, label]) => (
              <div key={String(label)} className="bg-white p-6 text-center">
                <dt className="sr-only">{label}</dt>
                <dd>
                  <span className="tabular block font-display text-4xl font-semibold text-brand-900">{value}</span>
                  <span className="text-sm">{label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Prayer relay strip */}
      <section className="mx-auto mt-12 max-w-6xl px-4">
        <PrayerClock hubs={hubs} compact />
      </section>

      {/* Featured needs */}
      <section className="mx-auto mt-20 max-w-6xl px-4" aria-labelledby="needs-title">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="needs-title" className="text-4xl">Needs almost there</h2>
            <p className="mt-2">Many partners, one need. Every gift counts toward the total.</p>
          </div>
          <Link href="/needs" className="flex items-center gap-1 font-semibold text-brand hover:underline">
            All needs <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        {needs && needs.data.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {needs.data.map((n) => (
              <NeedCard key={n.code} need={n} />
            ))}
          </div>
        ) : (
          <p className="rounded-[var(--radius-card)] bg-surface p-8 text-center">
            Needs will appear here once the API is running.
          </p>
        )}
      </section>

      {/* Four pathways */}
      <section className="mx-auto mt-24 max-w-6xl px-4" aria-labelledby="paths-title">
        <h2 id="paths-title" className="text-center text-4xl">Four ways to labour with us</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PATHWAYS.map((p) => (
            <article key={p.title} className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
              <Image
                src={`/images/illustrations/${p.art}`}
                alt={illustration(p.art).alt}
                width={1080}
                height={1080}
                sizes="(min-width: 1024px) 270px, 50vw"
                className="h-auto w-full"
              />
              <div className="flex flex-1 flex-col gap-2 p-5">
                <h3 className="text-2xl">{p.title}</h3>
                <p className="text-sm">{p.text}</p>
                {p.soon ? (
                  <span className="mt-auto pt-2 text-sm text-ink-500">{p.cta}</span>
                ) : (
                  <Link href={p.href} className="mt-auto flex items-center gap-1 pt-2 text-sm font-semibold text-brand hover:underline">
                    {p.cta} <ArrowRight className="size-4" aria-hidden />
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Illustrated series */}
      <section className="mt-24 bg-surface py-16" aria-labelledby="series-title">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="series-title" className="text-4xl">The co-labourer's calling</h2>
              <p className="mt-2">Our illustrated scripture series on prayer, watchfulness and giving.</p>
            </div>
            <Link href="/gallery" className="flex items-center gap-1 font-semibold text-brand hover:underline">
              See all 18 <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {["ezekiel-22-30.jpg", "habakkuk-2-1.jpg", "exodus-32-10.jpg", "gatekeepers-duty-post.jpg"].map((f) => (
              <ScriptureCard key={f} item={illustration(f)} sizes="(min-width: 768px) 270px, 50vw" />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
