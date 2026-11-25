import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarDays, Users } from "lucide-react";

import type { WatchSummary } from "@/lib/api/types";
import { formatRange } from "@/lib/time/watch";

export function WatchCard({ watch }: { watch: WatchSummary }) {
  return (
    <Link
      href={`/pray/watches/${watch.slug}`}
      className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] ring-1 ring-line sm:flex-row"
    >
      {watch.bannerImage && (
        <div className="relative h-48 shrink-0 sm:h-auto sm:w-52">
          <Image
            src={watch.bannerImage}
            alt=""
            fill
            sizes="208px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="text-2xl group-hover:text-brand">{watch.title}</h3>
        {watch.description && <p className="line-clamp-2 text-sm">{watch.description}</p>}
        <p className="mt-auto flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-500">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4" aria-hidden /> {formatRange(watch.startsAt, watch.endsAt, "Africa/Lagos")}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="size-4" aria-hidden /> {watch.signupCount} signed up
          </span>
        </p>
        <span className="inline-flex w-fit items-center gap-3 rounded-full bg-night py-1.5 pr-1.5 pl-4 text-sm font-semibold text-white">
          Reserve your shift
          <span className="flex size-8 items-center justify-center rounded-full bg-aqua text-night" aria-hidden>
            <ArrowUpRight className="size-4" />
          </span>
        </span>
      </div>
    </Link>
  );
}
