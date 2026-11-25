import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, MapPin, ShieldCheck, Users } from "lucide-react";

import { TopPanel } from "@/components/layout/TopPanel";
import { GivePanel } from "@/components/needs/GivePanel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { categoryLabels } from "@/config/site";
import { apiGet, apiGetOrNull } from "@/lib/api/client";
import type { NeedCard, NeedDetail, Page } from "@/lib/api/types";
import { STATIC_EXPORT } from "@/lib/static";
import { daysLeft, formatMinor } from "@/lib/money/format";

type Params = { code: string };

// The static preview pre-renders every sample need; the live site renders on demand.
export async function generateStaticParams(): Promise<Params[]> {
  if (!STATIC_EXPORT) return [];
  const lists = await Promise.all(
    ["live", "fulfilled"].map((status) => apiGet<Page<NeedCard>>(`/needs?status=${status}&pageSize=50`)),
  );
  return lists.flatMap((l) => l.data.map((n) => ({ code: n.code })));
}

async function load(code: string) {
  return apiGetOrNull<NeedDetail>(`/needs/${encodeURIComponent(code)}`, { tags: [`need:${code.toUpperCase()}`] });
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const need = await load((await params).code);
  if (!need) return { title: "Need not found" };
  return {
    title: `${need.title} (${need.code})`,
    description: need.summary,
    openGraph: { images: need.coverImage ? [need.coverImage] : undefined },
  };
}

export default async function NeedPage({ params }: { params: Promise<Params> }) {
  const need = await load((await params).code);
  if (!need) notFound();
  const left = daysLeft(need.deadlineAt);

  return (
    <>
      <TopPanel>
        <div className="space-y-5 px-5 pt-4 pb-12 sm:px-8 sm:pt-8">
          <Link href="/needs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-aqua hover:text-white">
            <ArrowLeft className="size-4" aria-hidden /> All needs
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-white px-2.5 py-1 font-mono text-night">{need.code}</span>
            <span className="rounded-full border border-white/30 px-2.5 py-1 text-white">{categoryLabels[need.category]}</span>
            {need.urgency !== "NORMAL" && (
              <span className="rounded-full bg-give-700 px-2.5 py-1 text-white">
                {need.urgency === "CRITICAL" ? "Critical" : "Urgent"}
              </span>
            )}
          </div>
          <h1 className="max-w-3xl text-4xl leading-[1.05] text-white sm:text-6xl">{need.title}</h1>
          <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-white/70">
            <span className="flex items-center gap-1.5"><MapPin className="size-4" aria-hidden /> {need.region.name}</span>
            {need.missionary && <span>For {need.missionary.publicName}</span>}
          </p>
        </div>
      </TopPanel>

      <div className="wrap py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <article className="space-y-8">
            <div className="rounded-[var(--radius-card)] bg-surface p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <p className="tabular text-ink-900">
                  <span className="font-display text-4xl font-semibold">{formatMinor(need.raisedMinor, need.currency)}</span>
                  <span className="ml-2 text-ink-500">raised of {formatMinor(need.targetMinor, need.currency)}</span>
                </p>
                <span className="tabular font-display text-2xl font-semibold text-night">{need.percent}%</span>
              </div>
              <div className="mt-4">
                <ProgressBar percent={need.percent} label={`${need.percent}% funded`} />
              </div>
              <p className="mt-3 flex flex-wrap gap-5 text-sm">
                <span className="flex items-center gap-1.5"><Users className="size-4" aria-hidden /> {need.contributorCount} givers</span>
                {left !== null && need.percent < 100 && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-4" aria-hidden /> {left > 0 ? `${left} days left` : "Deadline passed"}
                  </span>
                )}
              </p>
            </div>

            {need.coverImage && (
              <Image
                src={need.coverImage}
                alt=""
                width={1080}
                height={1080}
                sizes="(min-width: 1024px) 640px, 100vw"
                className="h-auto w-full max-w-2xl rounded-[var(--radius-card)] shadow-[var(--shadow-card)]"
                priority
              />
            )}

            <section className="space-y-3">
              <h2 className="text-3xl">The story</h2>
              <p className="text-lg leading-relaxed whitespace-pre-line">{need.story}</p>
            </section>

            {need.missionary?.isSensitive && (
              <p className="flex gap-3 rounded-2xl bg-aqua-50 p-4 text-sm text-ink-900">
                <ShieldCheck className="size-5 shrink-0 text-night" aria-hidden />
                This labourer serves in a sensitive area. We show an alias and region only, to keep them safe.
              </p>
            )}

            <section className="space-y-3">
              <h2 className="text-3xl">Updates</h2>
              {need.updates.length ? (
                need.updates.map((u) => (
                  <div key={u.createdAt} className="rounded-2xl border border-line p-4">
                    <p className="font-semibold text-ink-900">{u.title}</p>
                    <p className="mt-1">{u.body}</p>
                  </div>
                ))
              ) : (
                <p className="text-ink-500">When this need is met, you'll see photos and a thank-you from the field here.</p>
              )}
            </section>
          </article>

          <aside id="give" className="scroll-mt-6 lg:sticky lg:top-6 lg:self-start">
            <GivePanel need={need} />
          </aside>
        </div>
      </div>

      {need.percent < 100 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 p-3 backdrop-blur lg:hidden">
          <a
            href="#give"
            className="flex min-h-12 items-center justify-between rounded-full bg-ink-900 py-1.5 pr-1.5 pl-5 font-semibold text-white"
          >
            Give · {formatMinor(need.availableMinor, need.currency)} to go
            <span className="flex size-9 items-center justify-center rounded-full bg-aqua text-night" aria-hidden>
              <ArrowRight className="size-4" />
            </span>
          </a>
        </div>
      )}
    </>
  );
}
