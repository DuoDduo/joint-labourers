import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Users } from "lucide-react";

import { PageIntro, TopPanel } from "@/components/layout/TopPanel";
import { WatchSignupForm } from "@/components/prayer/WatchSignupForm";
import { ButtonLink } from "@/components/ui/Button";
import { apiGet, apiGetOrNull } from "@/lib/api/client";
import type { PrayerHubConfig, WatchDetail } from "@/lib/api/types";
import { DEFAULT_HUBS } from "@/lib/time/hubs";
import { formatRange } from "@/lib/time/watch";

type Params = { slug: string };

async function load(slug: string) {
  return apiGetOrNull<WatchDetail>(`/prayer/watches/${encodeURIComponent(slug)}`, { revalidate: 30 });
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const watch = await load((await params).slug);
  return watch
    ? {
        title: watch.title,
        description: watch.description ?? undefined,
        openGraph: { images: watch.bannerImage ? [watch.bannerImage] : undefined },
      }
    : { title: "Prayer watch not found" };
}

export default async function WatchPage({ params }: { params: Promise<Params> }) {
  const [watch, hubs] = await Promise.all([
    load((await params).slug),
    apiGet<PrayerHubConfig[]>("/prayer/hubs", { revalidate: 3600 }).catch(() => DEFAULT_HUBS),
  ]);
  if (!watch) notFound();

  return (
    <>
      <TopPanel>
        <PageIntro
          eyebrow="Prayer watch"
          title={watch.title}
          aside={
            watch.bannerImage ? (
              <Image
                src={watch.bannerImage}
                alt=""
                width={1080}
                height={1080}
                sizes="288px"
                priority
                className="hidden h-auto w-72 rounded-2xl lg:block"
              />
            ) : undefined
          }
        >
          <Link href="/pray/watches" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-aqua hover:text-white">
            <ArrowLeft className="size-4" aria-hidden /> All prayer watches
          </Link>
          {watch.description && <p>{watch.description}</p>}
          <p className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-base text-white">
            <span className="flex items-center gap-2">
              <CalendarDays className="size-5 text-aqua" aria-hidden /> {formatRange(watch.startsAt, watch.endsAt, "Africa/Lagos")}
            </span>
            <span className="flex items-center gap-2">
              <Users className="size-5 text-aqua" aria-hidden /> {watch.signupCount} already signed up
            </span>
          </p>
          <ButtonLink href="#reserve" variant="accent" size="lg" arrow className="mt-7">
            Reserve your shift
          </ButtonLink>
        </PageIntro>
      </TopPanel>

      <div className="wrap py-14">
        <section id="reserve" className="mx-auto max-w-2xl scroll-mt-6" aria-labelledby="reserve-title">
          <div className="overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] ring-1 ring-line">
            <div className="border-b border-line px-6 py-6 text-center sm:px-10">
              <h2 id="reserve-title" className="text-2xl sm:text-3xl">{watch.title}</h2>
            </div>
            <div className="px-6 py-8 sm:px-10">
              <WatchSignupForm watch={watch} hubs={hubs} />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
