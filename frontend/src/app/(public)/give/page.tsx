import type { Metadata } from "next";

import { GiveForm } from "@/components/give/GiveForm";
import { ScriptureCard } from "@/components/illustrations/ScriptureCard";
import { PageIntro, TopPanel } from "@/components/layout/TopPanel";
import { illustration } from "@/config/illustrations";
import { apiGet } from "@/lib/api/client";
import { readSearch } from "@/lib/static";

export const metadata: Metadata = {
  title: "Give",
  description: "Give once or monthly in Naira, Dollars, Pounds, Euros, Canadian or Australian Dollars, or Shillings.",
};

type Breakdown = { data: { items: { label: string; percent: number }[]; note?: string } };

export default async function GivePage({ searchParams }: { searchParams: Promise<{ need?: string; amount?: string }> }) {
  const sp = await readSearch(searchParams);
  const needCode = sp.need && /^JLN-\d{4,}$/i.test(sp.need) ? sp.need.toUpperCase() : undefined;
  const amount = sp.amount && /^\d{1,15}$/.test(sp.amount) ? sp.amount : undefined;
  const breakdown = await apiGet<Breakdown>("/content/give.money_breakdown", { revalidate: 3600 }).catch(() => null);

  return (
    <>
    <TopPanel>
      <PageIntro eyebrow="Give" title={needCode ? `Give toward ${needCode}` : "Give to the labourers"}>
        <p>Your gift reaches labourers who serve without a salary. Give once, or partner every month.</p>
      </PageIntro>
    </TopPanel>
    <div className="wrap py-12">
      <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <GiveForm needCode={needCode} needAmountMinor={amount} />
        </div>

        <aside className="space-y-6">
          {breakdown && (
            <section className="rounded-[var(--radius-card)] border border-line p-6" aria-labelledby="where-title">
              <h2 id="where-title" className="text-2xl">Where your money goes</h2>
              <ul className="mt-4 space-y-3">
                {breakdown.data.items.map((item) => (
                  <li key={item.label}>
                    <div className="flex justify-between text-sm">
                      <span>{item.label}</span>
                      <span className="tabular font-semibold text-ink-900">{item.percent}%</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-brand-100">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${item.percent}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
              {breakdown.data.note && <p className="mt-4 text-xs text-ink-500">{breakdown.data.note}</p>}
            </section>
          )}
          <ScriptureCard item={illustration("ecclesiastes-3-1.jpg")} sizes="380px" />
        </aside>
      </div>
    </div>
    </>
  );
}
