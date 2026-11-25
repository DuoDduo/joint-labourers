import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin, ShieldCheck, Users } from "lucide-react";

import { GivePanel } from "@/components/needs/GivePanel";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { categoryLabels } from "@/config/site";
import { apiGetOrNull } from "@/lib/api/client";
import type { NeedDetail } from "@/lib/api/types";
import { daysLeft, formatMinor } from "@/lib/money/format";

type Params = { code: string };

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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/needs" className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> All needs
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_380px]">
        <article className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-brand-900">{need.code}</span>
            <Badge>{categoryLabels[need.category]}</Badge>
            {need.urgency !== "NORMAL" && <Badge tone="give">{need.urgency === "CRITICAL" ? "Critical" : "Urgent"}</Badge>}
          </div>
          <h1 className="text-4xl leading-tight font-semibold sm:text-5xl">{need.title}</h1>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
            <span className="flex items-center gap-1"><MapPin className="size-4" aria-hidden /> {need.region.name}</span>
            {need.missionary && <span>For {need.missionary.publicName}</span>}
          </p>

          {need.coverImage && (
            <Image
              src={need.coverImage}
              alt=""
              width={1080}
              height={1080}
              sizes="(min-width: 1024px) 640px, 100vw"
              className="h-auto w-full max-w-2xl rounded-2xl shadow-[var(--shadow-card)]"
              priority
            />
          )}

          <div className="space-y-3 rounded-[var(--radius-card)] bg-surface p-6">
            <ProgressBar percent={need.percent} label={`${need.percent}% funded`} />
            <p className="tabular text-lg text-ink-900">
              <strong>{formatMinor(need.raisedMinor, need.currency)}</strong> raised of {formatMinor(need.targetMinor, need.currency)}
              <span className="ml-2 font-semibold text-brand">{need.percent}%</span>
            </p>
            <p className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1"><Users className="size-4" aria-hidden /> {need.contributorCount} givers</span>
              {left !== null && need.percent < 100 && (
                <span className="flex items-center gap-1"><Clock className="size-4" aria-hidden /> {left > 0 ? `${left} days left` : "Deadline passed"}</span>
              )}
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-3xl">The story</h2>
            <p className="text-lg leading-relaxed whitespace-pre-line">{need.story}</p>
          </section>

          {need.missionary?.isSensitive && (
            <p className="flex gap-2 rounded-lg border border-line p-4 text-sm">
              <ShieldCheck className="size-5 shrink-0 text-brand" aria-hidden />
              This labourer serves in a sensitive area. We show an alias and region only, to keep them safe.
            </p>
          )}

          <section className="space-y-3">
            <h2 className="text-3xl">Updates</h2>
            {need.updates.length ? (
              need.updates.map((u) => (
                <div key={u.createdAt} className="rounded-lg border border-line p-4">
                  <p className="font-semibold text-ink-900">{u.title}</p>
                  <p className="mt-1">{u.body}</p>
                </div>
              ))
            ) : (
              <p className="text-ink-500">When this need is met, you'll see photos and a thank-you from the field here.</p>
            )}
          </section>
        </article>

        <aside id="give" className="scroll-mt-24 lg:sticky lg:top-28 lg:self-start">
          <GivePanel need={need} />
        </aside>
      </div>

      {need.percent < 100 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 p-3 backdrop-blur lg:hidden">
          <a
            href="#give"
            className="flex min-h-12 items-center justify-center rounded-full bg-give-700 font-semibold text-white"
          >
            Give to this need · {formatMinor(need.availableMinor, need.currency)} to go
          </a>
        </div>
      )}
    </div>
  );
}
