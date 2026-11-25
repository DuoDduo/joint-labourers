import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, Users } from "lucide-react";

import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { categoryLabels } from "@/config/site";
import type { NeedCard as Need } from "@/lib/api/types";
import { daysLeft, formatMinor, remainingMinor } from "@/lib/money/format";

export function NeedCard({ need }: { need: Need }) {
  const left = daysLeft(need.deadlineAt);
  const funded = need.percent >= 100;
  const remaining = remainingMinor(need.targetMinor, need.raisedMinor);

  return (
    <article className="group flex flex-col rounded-[var(--radius-card)] bg-white p-2.5 shadow-[var(--shadow-card)] ring-1 ring-line">
      <Link href={`/needs/${need.code}`} className="relative block aspect-[4/3] overflow-hidden rounded-[1.1rem] bg-surface">
        {need.coverImage && (
          <Image
            src={need.coverImage}
            alt=""
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}
        <span className="absolute top-3 left-3 rounded-full bg-white px-2.5 py-1 font-mono text-xs font-semibold text-night">
          {need.code}
        </span>
        {need.urgency !== "NORMAL" && !funded && (
          <span className="absolute top-3 right-3 rounded-full bg-give-700 px-2.5 py-1 text-xs font-semibold text-white">
            {need.urgency === "CRITICAL" ? "Critical" : "Urgent"}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 px-3 pt-4 pb-3">
        <div className="flex flex-wrap gap-2">
          <Badge>{categoryLabels[need.category] ?? need.category}</Badge>
          {funded && <Badge tone="gold">Fully funded</Badge>}
        </div>

        <h3 className="text-[1.35rem] leading-snug">
          <Link href={`/needs/${need.code}`} className="hover:text-brand">
            {need.title}
          </Link>
        </h3>

        <p className="flex items-center gap-1.5 text-sm text-ink-500">
          <MapPin className="size-4" aria-hidden />
          {need.missionary ? `${need.missionary.publicName} · ` : ""}
          {need.region.name}
        </p>

        <div className="mt-auto space-y-2 pt-2">
          <div className="flex items-baseline justify-between">
            <span className="tabular font-display text-2xl font-semibold text-ink-900">
              {formatMinor(need.raisedMinor, need.currency)}
            </span>
            <span className="tabular text-sm font-semibold text-ink-900">{need.percent}%</span>
          </div>
          <ProgressBar percent={need.percent} label={`${need.percent}% funded`} size="sm" />
          <div className="flex items-center justify-between text-xs text-ink-500">
            <span>of {formatMinor(need.targetMinor, need.currency)}</span>
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1"><Users className="size-3.5" aria-hidden /> {need.contributorCount}</span>
              {left !== null && !funded && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" aria-hidden /> {left > 0 ? `${left}d left` : "Ended"}
                </span>
              )}
            </span>
          </div>
        </div>

        {!funded && (
          <Link
            href={`/needs/${need.code}`}
            className="mt-2 flex min-h-11 items-center justify-between rounded-full bg-ink-900 py-1.5 pr-1.5 pl-5 text-sm font-semibold text-white transition-colors hover:bg-black"
          >
            Give · {formatMinor(remaining.toString(), need.currency)} to go
            <span className="flex size-8 items-center justify-center rounded-full bg-aqua text-night" aria-hidden>
              <ArrowRight className="size-4" />
            </span>
          </Link>
        )}
      </div>
    </article>
  );
}
