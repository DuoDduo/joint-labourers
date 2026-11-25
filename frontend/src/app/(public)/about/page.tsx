import type { Metadata } from "next";
import Image from "next/image";
import { BookOpen, Compass, Eye, Flame, Quote, Sprout, Target } from "lucide-react";

import { Eyebrow, PageIntro, TopPanel } from "@/components/layout/TopPanel";
import { ButtonLink } from "@/components/ui/Button";
import { illustration } from "@/config/illustrations";
import { photos } from "@/config/photos";
import { apiGet } from "@/lib/api/client";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Joint Labourers In Christ Int'l is a non-denominational Christian organization equipping the saints and supporting the everyday needs of co-labourers in the field.",
};

export const revalidate = 3600;

// Content from the original jointlabourers.org/about page.
const MANDATE = [
  "Gather up saints that will minister to the Lord in intercessory prayers and worship, and minister to the needs of full-time servants in non-denominational mission fields and ministries.",
  "Dispel territorial darkness across the nations and set at liberty people groups in every nation, tribe, and tongue.",
];
const SCRIPTURES = ["Psalm 50:5", "John 4:23–24", "Luke 8:1–3", "Matthew 27:57–60", "Colossians 4:12–13", "Matthew 4:15–16"];

const JOURNEY = [
  {
    year: "2021",
    icon: Sprout,
    title: "A burden is born",
    text: "Founded with a burden to connect willing channels to the needs of full-time servants of God in non-denominational mission fields and ministries across the nations.",
  },
  {
    year: "2023",
    icon: Flame,
    title: "Called deeper",
    text: "God began to demand that the channels and networks we were building for Him be in the similitude of Psalm 50:5: saints gathered in covenant by sacrifice.",
  },
  {
    year: "Today",
    icon: Compass,
    title: "Together for souls",
    text: "Together, God is counting on us to dispel territorial darkness across the nations of the earth and set at liberty people groups in every nation, tribe, and tongue.",
  },
];

type Breakdown = { data: { items: { label: string; percent: number }[]; note?: string } };

export default async function AboutPage() {
  const breakdown = await apiGet<Breakdown>("/content/give.money_breakdown", { revalidate: 3600 }).catch(() => null);

  return (
    <>
      <TopPanel photo={photos.communityCare} photoPosition="50% 35%">
        <PageIntro eyebrow="About us" title={<>Heralding the light of His glory <em>in the nations</em></>}>
          <p>
            Joint Labourers In Christ Int’l (JLICI) is a non-denominational Christian organization committed to equipping
            the saints (co-labourers) in God’s service and supporting their necessities: the everyday needs of co-labourers
            in the field.
          </p>
        </PageIntro>
      </TopPanel>

      {/* ── Who we are ─────────────────────────────────────────────── */}
      <section className="wrap mt-20 sm:mt-28" aria-labelledby="heart-title">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div className="space-y-6">
            <Eyebrow>Who we are</Eyebrow>
            <h2 id="heart-title" className="text-4xl leading-tight sm:text-5xl">
              Understanding the heart of <em>Joint Labourers</em>
            </h2>
            <p className="text-lg">
              We are not a church or a denominational entity, but we belong to the Church, the body of Christ, with a mandate
              to equip the saints together for souls.
            </p>
            <figure className="rounded-[var(--radius-card)] bg-night p-7 text-white">
              <Quote className="size-7 text-aqua" aria-hidden />
              <blockquote className="mt-3 font-display text-2xl leading-snug">
                The heart and service behind the veil,{" "}
                <em className="font-serif text-aqua italic">before service at the outer court.</em>
              </blockquote>
              <figcaption className="mt-3 text-sm text-white/60">Our mantra since 2023</figcaption>
            </figure>
          </div>
          <div className="relative h-[420px] overflow-hidden rounded-[var(--radius-card)] sm:h-[500px]">
            <Image
              src={photos.volunteersLagos.src}
              alt={photos.volunteersLagos.alt}
              fill
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── Mandate ────────────────────────────────────────────────── */}
      <section className="wrap mt-24" aria-labelledby="mandate-title">
        <div className="relative isolate overflow-hidden rounded-[var(--radius-panel)] bg-night p-7 text-white sm:p-12">
          <Image src="/images/illustrations/isaiah-62-6.jpg" alt="" fill sizes="100vw" className="-z-10 object-cover opacity-10" />
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
            <div className="space-y-5">
              <Eyebrow onDark>The mandate</Eyebrow>
              <h2 id="mandate-title" className="text-4xl leading-tight text-white sm:text-5xl">
                The mandate <em>is clear</em>
              </h2>
              <div className="flex flex-wrap gap-2 pt-2">
                {SCRIPTURES.map((s) => (
                  <span key={s} className="flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-1 text-xs text-white/85">
                    <BookOpen className="size-3.5 text-aqua" aria-hidden /> {s}
                  </span>
                ))}
              </div>
            </div>
            <ol className="space-y-5">
              {MANDATE.map((m, i) => (
                <li key={m} className="flex gap-5 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                  <span className="font-serif text-4xl text-aqua italic">0{i + 1}</span>
                  <p className="text-lg leading-relaxed text-white/90">{m}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── Mission & vision ───────────────────────────────────────── */}
      <section className="wrap mt-24" aria-label="Mission and vision">
        <div className="grid gap-5 md:grid-cols-2">
          <article className="rounded-[var(--radius-card)] bg-surface p-8 sm:p-10">
            <span className="flex size-12 items-center justify-center rounded-full bg-night text-white">
              <Target className="size-5" aria-hidden />
            </span>
            <h2 className="mt-6 text-3xl">Our mission</h2>
            <p className="mt-3 font-display text-xl leading-snug text-ink-900">
              To advance the gospel of Jesus Christ on the earth as co-labourers with Him; fellow soldiers, companions, and
              messengers of His servants in the nations.
            </p>
          </article>
          <article className="rounded-[var(--radius-card)] bg-aqua-50 p-8 sm:p-10">
            <span className="flex size-12 items-center justify-center rounded-full bg-aqua text-night">
              <Eye className="size-5" aria-hidden />
            </span>
            <h2 className="mt-6 text-3xl">Our vision</h2>
            <p className="mt-3 font-display text-xl leading-snug text-ink-900">
              To inspire a continuous flow of multigenerational labourers in the Lord’s field who faithfully finish their
              missions on earth, trusting the Lord of the harvest for a fruitful seed in every people group across the nations.
            </p>
          </article>
        </div>
      </section>

      {/* ── Our journey ────────────────────────────────────────────── */}
      <section className="wrap mt-28" aria-labelledby="journey-title">
        <div className="mb-12 space-y-4">
          <Eyebrow>Our journey</Eyebrow>
          <h2 id="journey-title" className="max-w-2xl text-4xl leading-tight sm:text-5xl">
            A journey fuelled by <em>faith and dedication</em>
          </h2>
        </div>
        <ol className="grid gap-5 lg:grid-cols-3">
          {JOURNEY.map((j) => (
            <li key={j.year} className="rounded-[var(--radius-card)] border border-line p-7">
              <div className="flex items-center justify-between">
                <span className="font-serif text-5xl text-night italic">{j.year}</span>
                <span className="flex size-11 items-center justify-center rounded-full bg-aqua-100 text-night">
                  <j.icon className="size-5" aria-hidden />
                </span>
              </div>
              <h3 className="mt-6 text-2xl">{j.title}</h3>
              <p className="mt-2">{j.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Accountability ─────────────────────────────────────────── */}
      <section className="mt-28 bg-surface py-20" aria-labelledby="account-title">
        <div className="wrap grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-5">
            <Eyebrow>Accountability</Eyebrow>
            <h2 id="account-title" className="text-4xl leading-tight sm:text-5xl">
              Faithful with <em>every gift</em>
            </h2>
            <p className="text-lg">
              Every need is checked by a field coordinator before it is published, every gift is recorded, and every funded
              need ends with a report from the field that givers can see.
            </p>
            <ButtonLink href="/needs" variant="night" arrow>
              See the needs
            </ButtonLink>
          </div>
          {breakdown && (
            <div className="rounded-[var(--radius-card)] bg-white p-7 shadow-[var(--shadow-card)]">
              <p className="font-display text-2xl text-ink-900">Where your money goes</p>
              <ul className="mt-6 space-y-5">
                {breakdown.data.items.map((item) => (
                  <li key={item.label}>
                    <div className="flex justify-between">
                      <span>{item.label}</span>
                      <span className="tabular font-semibold text-ink-900">{item.percent}%</span>
                    </div>
                    <div className="mt-2 h-2.5 rounded-full bg-surface">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand to-aqua" style={{ width: `${item.percent}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
              {breakdown.data.note && <p className="mt-5 text-xs text-ink-500">{breakdown.data.note}</p>}
            </div>
          )}
        </div>
      </section>

      {/* ── Leadership ─────────────────────────────────────────────── */}
      <section className="wrap mt-24" aria-labelledby="leaders-title">
        <div className="mb-10 space-y-4">
          <Eyebrow>Leadership</Eyebrow>
          <h2 id="leaders-title" className="text-4xl leading-tight sm:text-5xl">
            Serving <em>together</em>
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-[var(--radius-card)] bg-surface p-3">
            <div className="flex aspect-square items-center justify-center rounded-2xl bg-night font-display text-5xl text-white" aria-hidden>
              WS
            </div>
            <div className="p-3 pt-5">
              <h3 className="text-xl">Mr Wole Sina-Olulana</h3>
              <p className="text-sm text-ink-500">Director</p>
            </div>
          </article>
          <article className="flex flex-col justify-center rounded-[var(--radius-card)] border border-dashed border-line p-6 text-ink-500 lg:col-span-3">
            <p className="font-display text-xl text-ink-900">Board and leadership profiles</p>
            <p className="mt-2 text-sm">Photos and short biographies of the trustees and leadership team will appear here.</p>
          </article>
        </div>
      </section>

      {/* ── Closing call ───────────────────────────────────────────── */}
      <section className="wrap mt-24" aria-labelledby="calling-title">
        <div className="grid gap-10 rounded-[var(--radius-panel)] bg-aqua-50 p-6 sm:p-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div className="space-y-5">
            <Eyebrow>Your place</Eyebrow>
            <h2 id="calling-title" className="text-4xl leading-tight sm:text-5xl">
              The Lord of the Harvest is <em>counting on you</em>
            </h2>
            <p className="text-lg">Pray, give, adopt a missionary or open your home. There is a place for you in the field.</p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/pray" variant="night" size="lg" arrow>
                Pray with us
              </ButtonLink>
              <ButtonLink href="/needs" variant="outline" size="lg">
                Fund a need
              </ButtonLink>
            </div>
          </div>
          <Image
            src="/images/illustrations/revelation-4-10.jpg"
            alt={illustration("revelation-4-10.jpg").alt}
            width={1080}
            height={1080}
            sizes="(min-width: 1024px) 420px, 100vw"
            className="h-auto w-full max-w-md justify-self-end rounded-[var(--radius-card)] shadow-[var(--shadow-card)]"
          />
        </div>
      </section>
    </>
  );
}
