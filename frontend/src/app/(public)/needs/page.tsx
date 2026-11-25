import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

import { NeedCard } from "@/components/needs/NeedCard";
import { categoryLabels } from "@/config/site";
import { illustration } from "@/config/illustrations";
import { apiGet } from "@/lib/api/client";
import type { ImpactStats, NeedCard as Need, Page, Region } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Missionary needs",
  description: "Real, checked needs from missionaries in the field. Give any amount; many partners meet one need together.",
};

type Search = { category?: string; region?: string; almostThere?: string; status?: string };

export default async function NeedsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const status = sp.status === "fulfilled" ? "fulfilled" : "live";
  const qs = new URLSearchParams({ status, pageSize: "24" });
  if (sp.category) qs.set("category", sp.category);
  if (sp.region) qs.set("region", sp.region);
  if (sp.almostThere === "true") qs.set("almostThere", "true");

  const [needs, regions, stats] = await Promise.all([
    apiGet<Page<Need>>(`/needs?${qs}`, { tags: ["needs:list"] }),
    apiGet<Region[]>("/regions", { revalidate: 3600 }),
    apiGet<ImpactStats>("/stats/impact").catch(() => null),
  ]);

  const link = (patch: Partial<Search>) => {
    const next = new URLSearchParams();
    const merged = { ...sp, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    const s = next.toString();
    return s ? `/needs?${s}` : "/needs";
  };

  return (
    <>
      <section className="bg-brand-50">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <h1 className="text-5xl font-semibold">Missionary needs</h1>
            <p className="max-w-2xl text-lg">
              Each need is specific, costed and checked by our field coordinators. Give any amount. When many give, the
              need is met, and you'll see the proof.
            </p>
            {stats && (
              <p className="tabular text-lg text-ink-900">
                <strong className="text-brand">{stats.needsMetThisYear} of {stats.needsTotalThisYear}</strong> needs met this year
              </p>
            )}
          </div>
          <Image
            src="/images/illustrations/philippians-2-25.jpg"
            alt={illustration("philippians-2-25.jpg").alt}
            width={1080}
            height={1080}
            sizes="320px"
            className="hidden h-auto w-full rounded-2xl shadow-[var(--shadow-card)] md:block"
          />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <nav aria-label="Filter needs" className="mb-8 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Chip href={link({ status: undefined })} active={status === "live"}>Open needs</Chip>
            <Chip href={link({ status: "fulfilled", almostThere: undefined })} active={status === "fulfilled"}>Met needs</Chip>
            <Chip href={link({ almostThere: sp.almostThere === "true" ? undefined : "true", status: undefined })} active={sp.almostThere === "true"}>
              Almost there (75%+)
            </Chip>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip href={link({ category: undefined })} active={!sp.category} subtle>All categories</Chip>
            {["MEDICAL", "EDUCATION", "HOUSING", "TRANSPORT", "FOOD_UPKEEP", "MINISTRY_EQUIPMENT"].map((c) => (
              <Chip key={c} href={link({ category: c })} active={sp.category === c} subtle>
                {categoryLabels[c]}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip href={link({ region: undefined })} active={!sp.region} subtle>All regions</Chip>
            {regions.map((r) => (
              <Chip key={r.slug} href={link({ region: r.slug })} active={sp.region === r.slug} subtle>
                {r.name}
              </Chip>
            ))}
          </div>
        </nav>

        {needs.data.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {needs.data.map((n) => (
              <NeedCard key={n.code} need={n} />
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius-card)] bg-surface p-10 text-center">
            <p className="font-display text-2xl text-ink-900">No needs match these filters right now.</p>
            <p className="mt-2">
              You can still give to the <Link className="font-semibold text-brand underline" href="/give">Missionary Care Fund</Link>.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

function Chip({ href, active, subtle, children }: { href: string; active: boolean; subtle?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={clsx(
        "inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold transition-colors",
        active ? "bg-brand text-white" : subtle ? "bg-white text-ink-900 ring-1 ring-line hover:ring-brand" : "bg-white text-brand ring-2 ring-brand-200 hover:ring-brand",
      )}
    >
      {children}
    </Link>
  );
}
