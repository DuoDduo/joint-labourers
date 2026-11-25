import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Check, Clock4, Globe2, HandHeart, Lightbulb, ShieldCheck, UserRound } from "lucide-react";

import { WaysCarousel } from "@/components/home/WaysCarousel";
import { Eyebrow, TopPanel } from "@/components/layout/TopPanel";
import { NeedCard } from "@/components/needs/NeedCard";
import { HubStrip } from "@/components/prayer/HubStrip";
import { ButtonLink } from "@/components/ui/Button";
import { illustration } from "@/config/illustrations";
import { photos } from "@/config/photos";
import { apiGet } from "@/lib/api/client";
import type { ImpactStats, NeedCard as Need, Page, PrayerHubConfig } from "@/lib/api/types";
import { DEFAULT_HUBS } from "@/lib/time/hubs";

export const revalidate = 60;

// Content from the original jointlabourers.org landing page.
const OUTREACH = [
  { icon: Globe2, title: "People Groups", text: "Unreached territories" },
  { icon: UserRound, title: "Independent Missionaries", text: "Missionaries without parent church support" },
];

const HOUR_OF_PRAYER = [
  { title: "Intercessory prayers for the nations", text: "Carried by partners in Sydney, Lagos, New York and Vancouver." },
  { title: "Uncoordinated 24×7 prayer on the hour", text: "Claim any hour of the week and pray in your own time zone." },
  { title: "Quarterly 24-hour cycle", text: "Eight 3-hour shifts, passed around the world in one day." },
];

const DID_YOU_KNOW = [
  "The single greatest reason most missionaries don't last on the field is a lack of funding and support structure.",
  "Most missionaries are not on salaries but live by faith, trusting God for support from you and me.",
  "Missionaries have human faces with family commitments like you and me: child care, school fees, shelter, food, etc.",
];

export default async function HomePage() {
  const [stats, needs, hubs] = await Promise.all([
    apiGet<ImpactStats>("/stats/impact").catch(() => null),
    apiGet<Page<Need>>("/needs?sort=progress&pageSize=3", { tags: ["needs:list"] }).catch(() => null),
    apiGet<PrayerHubConfig[]>("/prayer/hubs", { revalidate: 3600 }).catch(() => DEFAULT_HUBS),
  ]);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <TopPanel photo={photos.childrenGulu} photoPosition="60% 35%">
        <div className="grid min-h-[600px] gap-10 px-5 pt-14 pb-10 sm:px-8 sm:pt-20 lg:min-h-[660px] lg:grid-cols-[1.3fr_1fr] lg:items-end lg:px-12 lg:pb-14">
          <div className="space-y-6 self-center">
            <div className="flex w-fit items-center gap-3 rounded-full bg-white/10 py-1.5 pr-4 pl-1.5 backdrop-blur">
              <span className="flex size-8 items-center justify-center rounded-full bg-aqua text-night">
                <HandHeart className="size-4" aria-hidden />
              </span>
              <span className="text-sm font-semibold text-white">Join our mission</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {["Non-denominational", "Prayer first", "Missionary care"].map((t) => (
                <span key={t} className="rounded-full border border-white/30 px-3 py-1 text-xs text-white/90">
                  {t}
                </span>
              ))}
            </div>

            <h1 className="max-w-3xl text-[2.6rem] leading-[1.04] text-white sm:text-6xl lg:text-[4.5rem]">
              Equipping the saints together <em>for souls</em>
            </h1>
            <p className="max-w-xl text-base text-white/80 sm:text-lg">
              Together we will advance the gospel of Jesus Christ on the earth as co-labourers with Him; fellow soldiers,
              companions and messengers of His servants in the nations.
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <ButtonLink href="/#who-we-are" variant="accent" size="lg" arrow>
                Who we are
              </ButtonLink>
              <Link href="/needs" className="inline-flex items-center gap-1 font-semibold text-white underline underline-offset-4 hover:text-aqua">
                Fund a need <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="flex flex-col items-start gap-4 lg:items-end">
            <ul className="space-y-1 text-xs text-white/80 lg:text-right">
              <li className="flex items-center gap-1.5 lg:justify-end">
                <ShieldCheck className="size-4 text-aqua" aria-hidden /> No giving without a commitment to pray
              </li>
              <li>Reaching unreached territories</li>
              <li>Caring for missionaries without parent church support</li>
            </ul>
            <Link
              href="/pray"
              className="flex w-full max-w-sm items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md transition-colors hover:bg-white/15"
            >
              <div className="flex-1">
                <p className="font-display text-3xl font-semibold text-white">
                  {stats ? `${stats.prayerHoursCovered}/168` : "24×7"}
                </p>
                <p className="text-xs text-white/75">Weekly prayer hours covered</p>
                <div className="mt-3 flex -space-x-2">
                  {["isaiah-62-6.jpg", "ephesians-6-18.jpg", "habakkuk-2-1.jpg", "ezekiel-22-30.jpg"].map((f) => (
                    <Image key={f} src={`/images/illustrations/${f}`} alt="" width={64} height={64} className="size-8 rounded-full object-cover ring-2 ring-night" />
                  ))}
                </div>
              </div>
              <div className="relative size-28 shrink-0 overflow-hidden rounded-xl">
                <Image src="/images/illustrations/matthew-26-41-watch.jpg" alt={illustration("matthew-26-41-watch.jpg").alt} fill sizes="112px" className="object-cover" />
                <span className="absolute inset-x-1.5 bottom-1.5 rounded-full bg-white/90 py-0.5 text-center text-[10px] font-semibold text-night">
                  Hour of prayer
                </span>
              </div>
            </Link>
          </div>
        </div>
      </TopPanel>

      {/* ── Live prayer hubs ─────────────────────────────────────────── */}
      <HubStrip hubs={hubs} />

      {/* ── Who we are ───────────────────────────────────────────────── */}
      <section id="who-we-are" className="wrap mt-20 scroll-mt-6 sm:mt-28" aria-labelledby="who-title">
        <div className="grid gap-10 lg:grid-cols-[380px_1fr] xl:grid-cols-[440px_1fr]">
          <div className="space-y-4">
            <Eyebrow>Who we are</Eyebrow>
            <div className="relative h-64 overflow-hidden rounded-[var(--radius-card)] lg:h-72">
              <Image src={photos.volunteersLagos.src} alt={photos.volunteersLagos.alt} fill sizes="440px" className="object-cover" />
            </div>
          </div>
          <div className="space-y-7 lg:pt-8">
            <h2 id="who-title" className="text-4xl leading-tight sm:text-5xl">
              Our mandate, vision <em>and mission</em>
            </h2>
            <p className="font-display text-2xl leading-snug text-ink-900 sm:text-[1.7rem]">
              Joint Labourers in Christ Int’l (JLICI) is a non-denominational Christian organization committed to equipping
              the saints (co-labourers) in God’s service and supporting their necessities: everyday needs of co-labourers in
              the field.
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <ButtonLink href="/needs" variant="night" arrow>
                See the needs
              </ButtonLink>
              <Link href="/about" className="inline-flex items-center gap-1 font-semibold text-ink-900 underline underline-offset-4 hover:text-brand">
                Read more <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>

        {/* Outreach focus */}
        <div className="mt-14 grid gap-5 md:grid-cols-[auto_1fr_1fr] md:items-stretch">
          <div className="flex items-center rounded-[var(--radius-card)] bg-night px-7 py-6 text-white">
            <p className="font-display text-2xl leading-tight">
              Outreach <em className="font-serif italic">focus</em>
            </p>
          </div>
          {OUTREACH.map((o) => (
            <div key={o.title} className="flex items-center gap-5 rounded-[var(--radius-card)] bg-surface p-6">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-aqua-100 text-night">
                <o.icon className="size-6" aria-hidden />
              </span>
              <div>
                <h3 className="text-2xl">{o.title}</h3>
                <p className="text-ink-500">{o.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Get involved: Luke 8:3 ───────────────────────────────────── */}
      <section className="mt-28 bg-aqua-50 py-20" aria-labelledby="involved-title">
        <div className="wrap grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="space-y-6">
            <Eyebrow>Get involved</Eyebrow>
            <h2 id="involved-title" className="text-4xl leading-tight sm:text-6xl">
              Is the Lord of the Harvest <em>nudging your heart?</em>
            </h2>
            <blockquote className="max-w-xl border-l-2 border-brand pl-5 text-lg text-ink-900">
              “Joanna the wife of Chuza…and many others. These women were helping to support them out of their means.”
              <span className="mt-2 block text-sm text-ink-500">Luke 8:3</span>
            </blockquote>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/needs" variant="night" size="lg" arrow>
                Fund a need
              </ButtonLink>
              <ButtonLink href="/pray" variant="outline" size="lg">
                Claim a prayer hour
              </ButtonLink>
            </div>
          </div>
          <Image
            src="/images/illustrations/luke-8-3.jpg"
            alt={illustration("luke-8-3.jpg").alt}
            width={1080}
            height={1080}
            sizes="(min-width: 1024px) 520px, 100vw"
            className="h-auto w-full max-w-xl justify-self-end rounded-[var(--radius-card)] shadow-[var(--shadow-card)]"
          />
        </div>
      </section>

      {/* ── Our model: prayer is the foundation ──────────────────────── */}
      <section className="wrap mt-28" aria-labelledby="model-title">
        <div className="mb-10 space-y-4">
          <Eyebrow>Our model</Eyebrow>
          <h2 id="model-title" className="max-w-3xl text-4xl leading-tight sm:text-5xl">
            Intercessory prayer: <em>the foundation</em>
          </h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          <article className="relative isolate overflow-hidden rounded-[var(--radius-card)] bg-night p-8 text-white sm:p-10">
            <Image src="/images/illustrations/exodus-32-10.jpg" alt="" fill sizes="600px" className="-z-10 object-cover opacity-20" />
            <p className="font-display text-3xl leading-snug sm:text-4xl">
              Intercessory prayers are core to our campaigns. At JLICI, <em className="font-serif text-aqua italic">no giving or act of service</em>{" "}
              is acceptable without a commitment to pray.
            </p>
            <ButtonLink href="/pray" variant="accent" arrow className="mt-8">
              Claim a prayer hour
            </ButtonLink>
          </article>
          <article className="rounded-[var(--radius-card)] bg-surface p-8 sm:p-10">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-night text-white">
                <Clock4 className="size-5" aria-hidden />
              </span>
              <h3 className="text-3xl">Hour of prayer</h3>
            </div>
            <ul className="mt-6 divide-y divide-line">
              {HOUR_OF_PRAYER.map((h) => (
                <li key={h.title} className="flex gap-4 py-4">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-aqua text-night">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold text-ink-900">{h.title}</p>
                    <p className="text-sm text-ink-500">{h.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      {/* ── Tiers of care (carousel) ─────────────────────────────────── */}
      <section className="mt-28" aria-labelledby="tiers-title">
        <div className="wrap mb-2 flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-4">
            <Eyebrow>Tiers of care</Eyebrow>
            <h2 id="tiers-title" className="max-w-xl text-4xl leading-tight sm:text-5xl">
              Ministering to <em>fellow co-labourers</em>
            </h2>
          </div>
          <p className="max-w-xs text-sm text-ink-500 sm:text-right">
            Five ways to stand with a missionary, from an hour of prayer to a bed for the night.
          </p>
        </div>
        <WaysCarousel />
      </section>

      {/* ── Did you know? ────────────────────────────────────────────── */}
      <section className="wrap mt-24" aria-labelledby="dyk-title">
        <h2 id="dyk-title" className="sr-only">Did you know?</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {DID_YOU_KNOW.map((fact, i) => (
            <article key={fact} className="flex flex-col rounded-[var(--radius-card)] border border-line p-7">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-ink-900">
                  <Lightbulb className="size-4 text-brand" aria-hidden /> Did you know?
                </span>
                <span className="font-serif text-3xl text-brand-200 italic">0{i + 1}</span>
              </div>
              <p className="mt-6 font-display text-xl leading-snug text-ink-900">{fact}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Contributive support: how it works ───────────────────────── */}
      <section className="mt-24 bg-surface py-20" aria-labelledby="how-title">
        <div className="wrap">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-4">
              <Eyebrow>Contributive support</Eyebrow>
              <h2 id="how-title" className="text-4xl leading-tight sm:text-5xl">
                From a need in the field, <em>to proof it was met</em>
              </h2>
            </div>
            <span className="flex size-11 items-center justify-center rounded-full bg-night text-white" aria-hidden>
              <ArrowDown className="size-4" />
            </span>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <article className="flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-white lg:row-span-2">
              <div className="p-6">
                <p className="text-sm text-ink-500">Step 01</p>
                <h3 className="mt-2 text-2xl">Pick a real, checked need</h3>
                <p className="mt-2 text-sm">Every need is costed and confirmed by a field coordinator before it goes live.</p>
              </div>
              <div className="relative mt-auto min-h-64 flex-1">
                <Image src="/images/illustrations/philippians-2-25.jpg" alt={illustration("philippians-2-25.jpg").alt} fill sizes="(min-width: 1024px) 440px, 100vw" className="object-cover object-top" />
              </div>
            </article>

            <article className="rounded-[var(--radius-card)] bg-white p-6">
              <p className="text-sm text-ink-500">Step 02</p>
              <h3 className="mt-2 text-2xl">Give any amount</h3>
              <p className="mt-2 text-sm">₦1,000 or the whole remainder. Card, USSD, bank transfer or mobile money, in seven currencies.</p>
              <div className="relative mx-auto mt-6 flex size-40 items-center justify-center" aria-hidden>
                <span className="absolute inset-0 rounded-full bg-aqua-50" />
                <span className="absolute inset-5 rounded-full bg-aqua-100" />
                <span className="relative flex size-16 items-center justify-center rounded-full bg-night font-display text-xl font-semibold text-white">₦</span>
                <span className="absolute top-3 -left-4 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-night shadow">$25</span>
                <span className="absolute -right-3 bottom-6 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-night shadow">£20</span>
                <span className="absolute -bottom-2 left-4 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-night shadow">25%</span>
              </div>
            </article>

            <article className="flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-white">
              <div className="p-6">
                <p className="text-sm text-ink-500">Step 03</p>
                <h3 className="mt-2 text-2xl">Many partners complete it</h3>
                <p className="mt-2 text-sm">Gifts add up live. No need is ever over-funded; any extra goes to the Missionary Care Fund.</p>
              </div>
              <div className="relative mt-auto h-36">
                <Image src={photos.foodBoxes.src} alt={photos.foodBoxes.alt} fill sizes="(min-width: 1024px) 440px, 100vw" className="object-cover" />
              </div>
            </article>

            <article className="relative overflow-hidden rounded-[var(--radius-card)] bg-night p-6 text-white lg:col-span-2">
              <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="text-sm text-white/60">Step 04</p>
                  <span className="mt-3 inline-block rounded-full bg-aqua px-3 py-1 text-xs font-semibold text-night">Proof guaranteed</span>
                  <h3 className="mt-3 text-2xl text-white">You see it was met</h3>
                  <p className="mt-2 max-w-sm text-sm text-white/75">
                    Photos and a thank-you from the field reach every giver, and stay on the need's page for anyone to see.
                  </p>
                </div>
                <div className="w-64 rotate-[-3deg] rounded-2xl bg-white p-4 text-ink-900 shadow-xl" aria-hidden>
                  <p className="font-serif text-lg italic">Fulfilment update</p>
                  <p className="text-xs text-ink-500">JLN-0006 · Bibles and discipleship</p>
                  <ul className="mt-3 space-y-2 text-sm">
                    {["Fully funded by 31 givers", "Funds sent to the field", "Photos from the field"].map((s) => (
                      <li key={s} className="flex items-center gap-2">
                        <span className="flex size-5 items-center justify-center rounded-full bg-aqua text-night"><Check className="size-3" /></span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── Needs almost there ───────────────────────────────────────── */}
      <section className="wrap mt-24" aria-labelledby="needs-title">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-4">
            <Eyebrow>Missionary needs</Eyebrow>
            <h2 id="needs-title" className="text-4xl leading-tight sm:text-5xl">
              Many partners, <em>one need</em>
            </h2>
          </div>
          <ButtonLink href="/needs" variant="outline" arrow>
            All needs
          </ButtonLink>
        </div>
        {needs && needs.data.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {needs.data.map((n) => (
              <NeedCard key={n.code} need={n} />
            ))}
          </div>
        ) : (
          <p className="rounded-[var(--radius-card)] bg-surface p-8 text-center">Needs will appear here once the API is running.</p>
        )}
      </section>

      {/* ── Illustrated series ───────────────────────────────────────── */}
      <section className="wrap mt-28" aria-labelledby="series-title">
        <div className="grid gap-10 rounded-[var(--radius-panel)] bg-aqua-50 p-6 sm:p-10 lg:grid-cols-[1fr_1.6fr] lg:items-center">
          <div className="space-y-5">
            <Eyebrow>Illustrated series</Eyebrow>
            <h2 id="series-title" className="text-4xl leading-tight sm:text-5xl">
              The co‑labourer’s <em>calling</em>
            </h2>
            <p>Eighteen panels on prayer, watchfulness and giving, drawn for JLICI and kept from our first website.</p>
            <ButtonLink href="/gallery" variant="night" arrow>
              See all 18
            </ButtonLink>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {["ezekiel-22-30.jpg", "habakkuk-2-1.jpg", "gatekeepers-duty-post.jpg", "esther-4-14.jpg"].map((f) => (
              <Image
                key={f}
                src={`/images/illustrations/${f}`}
                alt={illustration(f).alt}
                width={1080}
                height={1080}
                sizes="(min-width: 1024px) 220px, 25vw"
                className="h-auto w-full rounded-2xl shadow-[var(--shadow-card)]"
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
