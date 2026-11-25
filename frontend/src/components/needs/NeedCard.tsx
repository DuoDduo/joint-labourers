import Image from "next/image";
import Link from "next/link";
import { Clock, MapPin, Users } from "lucide-react";

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
    <article className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-white shadow-[var(--shadow-card)]">
      <Link href={`/needs/${need.code}`} className="relative block aspect-[4/3] overflow-hidden bg-brand-50">
        {need.coverImage && (
          <Image
            src={need.coverImage}
            alt=""
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 font-mono text-xs font-semibold text-brand-900">
          {need.code}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap gap-2">
          <Badge>{categoryLabels[need.category] ?? need.category}</Badge>
          {need.urgency !== "NORMAL" && <Badge tone="give">{need.urgency === "CRITICAL" ? "Critical" : "Urgent"}</Badge>}
          {funded && <Badge tone="gold">Fully funded</Badge>}
        </div>

        <h3 className="text-xl leading-snug font-semibold">
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
          <ProgressBar percent={need.percent} label={`${need.percent}% funded`} />
          <div className="flex items-baseline justify-between text-sm">
            <span className="tabular font-semibold text-ink-900">
              {formatMinor(need.raisedMinor, need.currency)}{" "}
              <span className="font-normal text-ink-500">of {formatMinor(need.targetMinor, need.currency)}</span>
            </span>
            <span className="tabular font-semibold text-brand">{need.percent}%</span>
          </div>
          <div className="flex items-center justify-between text-xs text-ink-500">
            <span className="flex items-center gap-1">
              <Users className="size-3.5" aria-hidden /> {need.contributorCount} givers
            </span>
            {left !== null && !funded && (
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" aria-hidden /> {left > 0 ? `${left} days left` : "Deadline passed"}
              </span>
            )}
          </div>
        </div>

        {!funded && (
          <Link
            href={`/needs/${need.code}`}
            className="mt-2 rounded-full bg-give-700 py-2.5 text-center text-sm font-semibold text-white hover:bg-[#a9461a]"
          >
            Give · {formatMinor(remaining.toString(), need.currency)} to go
          </Link>
        )}
      </div>
    </article>
  );
}
