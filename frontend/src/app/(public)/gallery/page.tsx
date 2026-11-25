import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowDown, ArrowUpRight, FileText, Globe2, HandHeart, PlayCircle, ShieldCheck, Sparkles } from "lucide-react";

import { StoryGallery, Tile, type GalleryItem } from "@/components/gallery/StoryGallery";
import { TopPanel } from "@/components/layout/TopPanel";
import { ButtonLink } from "@/components/ui/Button";
import { illustration } from "@/config/illustrations";
import { photos } from "@/config/photos";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "The story of a co-labourer, told in JLICI's illustrated scripture series: the call, standing in the gap, the watchman on the wall, ministering of their substance, and crowns before the throne.",
};

// ── Story data ──────────────────────────────────────────────────────────────
const art = (file: string): GalleryItem => {
  const i = illustration(file);
  return { src: `/images/illustrations/${file}`, width: 1080, height: 1080, alt: i.alt, caption: i.reference };
};
const photo = (p: (typeof photos)[keyof typeof photos]): GalleryItem => ({
  src: p.src,
  width: p.width,
  height: p.height,
  alt: p.alt,
  caption: p.alt,
  placeholder: true, // replace with JLICI field photography before launch
});

const CH1 = ["ezekiel-22-30.jpg", "esther-4-14.jpg", "exodus-31-3.jpg", "acts-6-3.jpg"].map(art);
const CH2 = ["isaiah-62-6.jpg", "exodus-32-10.jpg", "isaiah-59-15.jpg", "ephesians-6-18.jpg"].map(art);
const CH3 = [
  "habakkuk-2-1.jpg",
  "ezekiel-3-17.jpg",
  "matthew-26-41-watch.jpg",
  "matthew-26-41-arise.jpg",
  "gatekeepers-duty-post.jpg",
  "proverbs-8-15.jpg",
].map(art);
const CH4 = ["luke-8-3.jpg", "philippians-2-25.jpg", "ecclesiastes-3-1.jpg"].map(art);
const CH5 = art("revelation-4-10.jpg");
const FIELD = Object.values(photos).map(photo);
const ALL: GalleryItem[] = [...CH1, ...CH2, ...CH3, ...CH4, CH5, ...FIELD];

const PANORAMA = [CH3[0]!, CH2[0]!, CH4[0]!, CH1[0]!, CH2[2]!];
const FAN = [CH1[1]!, CH4[0]!, CH2[3]!];

const CHAPTERS = [
  { id: "the-call", n: "01", title: "The call" },
  { id: "standing-in-the-gap", n: "02", title: "Standing in the gap" },
  { id: "the-watchman", n: "03", title: "The watchman" },
  { id: "their-substance", n: "04", title: "Of their substance" },
  { id: "crowns", n: "05", title: "Crowns at His feet" },
  { id: "from-the-field", n: "06", title: "From the field" },
];

// ── Layout helpers ──────────────────────────────────────────────────────────
function Kicker({ a, b, onDark = false, center = false }: { a: string; b: string; onDark?: boolean; center?: boolean }) {
  return (
    <p
      className={clsx(
        "flex items-center gap-3 text-[11px] font-semibold tracking-[0.2em] uppercase",
        onDark ? "text-white/75" : "text-ink-500",
        center && "justify-center",
      )}
    >
      <span>{a}</span>
      <span aria-hidden className={clsx("h-px w-10", onDark ? "bg-white/40" : "bg-ink-900/30")} />
      <span>{b}</span>
    </p>
  );
}

/** Two-line headline with the second line indented, as in the reference. */
function Staggered({
  first,
  second,
  onDark = false,
  as: Tag = "h2",
  size = "md",
  id,
}: {
  first: ReactNode;
  second: ReactNode;
  onDark?: boolean;
  as?: "h1" | "h2";
  size?: "md" | "xl";
  id?: string;
}) {
  return (
    <Tag
      id={id}
      className={clsx(
        "leading-[1.02] uppercase",
        size === "xl" ? "text-[2.6rem] sm:text-6xl lg:text-7xl" : "text-[2.1rem] sm:text-5xl lg:text-[3.4rem]",
        onDark && "text-white",
      )}
    >
      <span className="block">{first}</span>
      <span className="block pl-[14%] sm:pl-[22%]">{second}</span>
    </Tag>
  );
}

function Caption({ item, light = false }: { item: GalleryItem; light?: boolean }) {
  return (
    <div className="mt-3 flex items-start justify-between gap-3">
      <p className={clsx("text-sm font-semibold", light ? "text-white" : "text-ink-900")}>{item.caption}</p>
      <ArrowUpRight className={clsx("size-4 shrink-0", light ? "text-aqua" : "text-brand")} aria-hidden />
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function GalleryPage() {
  return (
    <StoryGallery items={ALL}>
      {/* Hero: staggered title + curved panorama of panels */}
      <TopPanel>
        <div className="px-5 pt-12 sm:px-8 sm:pt-16 lg:px-12">
          <Kicker a="The gallery" b="A story in eighteen panels" onDark />
          <div className="mt-5">
            <Staggered as="h1" size="xl" onDark first="A journey" second={<>through <em className="normal-case">the calling</em></>} />
          </div>
        </div>

        {/* Phones: a swipeable row of large panels */}
        <div className="mt-10 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-10 [scrollbar-width:none] sm:hidden [&::-webkit-scrollbar]:hidden">
          {PANORAMA.map((item) => (
            <div key={item.src} className="w-[78vw] max-w-[340px] shrink-0 snap-start">
              <Tile item={item} sizes="80vw" className="rounded-2xl shadow-2xl" />
            </div>
          ))}
        </div>
        <p className="-mt-6 pb-8 text-center text-xs text-white/60 sm:hidden">Swipe to see more →</p>

        {/* Tablets and up: a curved gallery wall */}
        <div className="mt-10 hidden items-center justify-center gap-4 overflow-hidden px-3 pb-14 [perspective:1400px] sm:flex">
          {PANORAMA.map((item, i) => {
            const tilt = ["rotateY(26deg)", "rotateY(12deg)", "none", "rotateY(-12deg)", "rotateY(-26deg)"][i];
            const size = ["h-60 lg:h-80", "h-52 lg:h-68", "h-56 lg:h-72", "h-52 lg:h-68", "h-60 lg:h-80"][i];
            return (
              <div key={item.src} className="w-[19%] shrink-0" style={{ transform: tilt, transformStyle: "preserve-3d" }}>
                <Tile item={item} fill sizes="19vw" className={clsx("w-full rounded-xl shadow-2xl", size)} />
              </div>
            );
          })}
        </div>
      </TopPanel>

      {/* Chapter index */}
      <nav aria-label="Chapters" className="wrap -mt-6 relative z-10">
        <ol className="flex snap-x gap-2 overflow-x-auto rounded-full bg-white p-2 shadow-[var(--shadow-card)] ring-1 ring-line [scrollbar-width:none] sm:justify-center">
          {CHAPTERS.map((c) => (
            <li key={c.id} className="shrink-0 snap-start">
              <a href={`#${c.id}`} className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap text-ink-900 hover:bg-surface">
                <span className="font-serif text-brand italic">{c.n}</span> {c.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* Intro: centred, staggered, with a fanned stack */}
      <section className="wrap mt-24 text-center" aria-labelledby="intro-title">
        <Kicker a="The series" b="Joint Labourers" center />
        <h2 id="intro-title" className="mx-auto mt-5 max-w-3xl text-[2.1rem] leading-[1.05] uppercase sm:text-5xl lg:text-[3.4rem]">
          <span className="block sm:pr-[22%]">Eighteen panels,</span>
          <span className="block sm:pl-[24%]"><em className="normal-case">one calling</em></span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg">
          Drawn for JLICI and kept from our first website, these panels follow a co-labourer from the moment God asks
          <em> “who is available?”</em> to the day crowns are cast before His throne. Read them in order; each chapter is
          a step of the same journey.
        </p>
        <ButtonLink href="#the-call" variant="night" arrow className="mt-8">
          Begin the story
        </ButtonLink>

        <div className="relative mx-auto mt-16 flex h-[300px] max-w-xl items-end justify-center sm:h-[420px]">
          {FAN.map((item, i) => (
            <div
              key={item.src}
              className={clsx(
                "absolute bottom-0 w-[58%] sm:w-[42%]",
                i === 0 && "left-[2%] -rotate-[10deg]",
                i === 1 && "z-10 -translate-y-6",
                i === 2 && "right-[2%] rotate-[10deg]",
              )}
            >
              <Tile item={item} sizes="(min-width: 640px) 240px, 45vw" className="rounded-2xl shadow-2xl ring-4 ring-white" />
            </div>
          ))}
        </div>
      </section>

      {/* Chapter 1: staggered-height row (reference: "modern gallery") */}
      <section id="the-call" className="wrap mt-32 scroll-mt-6" aria-labelledby="ch1-title">
        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-end">
          <div>
            <Kicker a="Chapter 01" b="The call" />
            <div className="mt-5">
              <Staggered id="ch1-title" first="Who will" second={<em className="normal-case">stand in the gap?</em>} />
            </div>
          </div>
          <p className="text-lg lg:pb-2">
            It begins with a question God is still asking: “I sought for a man among them… but I found none.” Before anyone
            gives or goes, someone has to answer, for such a time as this.
          </p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {CH1.map((item, i) => (
            <figure key={item.src} className={clsx(i % 2 === 1 && "lg:mt-16", i === 2 && "mt-0 lg:mt-6")}>
              <Tile item={item} sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 100vw" className="rounded-[var(--radius-card)]" />
              <figcaption>
                <Caption item={item} />
                <p className="mt-1 line-clamp-2 text-sm text-ink-500">{item.alt}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Chapter 2: dark rounded band with a row (reference: "artworks that speak") */}
      <section id="standing-in-the-gap" className="mt-32 scroll-mt-6" aria-labelledby="ch2-title">
        <div className="rounded-[var(--radius-panel)] bg-night py-16 text-white sm:py-20">
          <div className="wrap">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <Kicker a="Chapter 02" b="Standing in the gap" onDark />
                <div className="mt-5">
                  <Staggered id="ch2-title" onDark first="Prayers that speak" second={<em className="normal-case">for the nations</em>} />
                </div>
              </div>
              <ButtonLink href="/pray" variant="outline-light" arrow>
                Pray with us
              </ButtonLink>
            </div>
            <p className="mt-6 max-w-2xl text-lg text-white/75">
              Then the labourer kneels. At JLICI, prayer is not the back-up plan: no giving or act of service is accepted
              without a commitment to pray, for America, Europe, Asia, Africa and Australia alike.
            </p>
            <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {CH2.map((item, i) => (
                <figure key={item.src} className={clsx(i % 2 === 1 && "lg:mt-10")}>
                  <Tile item={item} sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 100vw" className="rounded-2xl" />
                  <figcaption>
                    <Caption item={item} light />
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 3: sticky text beside an offset grid */}
      <section id="the-watchman" className="wrap mt-32 scroll-mt-6" aria-labelledby="ch3-title">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,24rem)_1fr]">
          <div className="space-y-6 lg:sticky lg:top-8 lg:self-start">
            <Kicker a="Chapter 03" b="The watchman" />
            <Staggered id="ch3-title" first="On the wall," second={<em className="normal-case">at the gate</em>} />
            <p className="text-lg">
              Some are posted as watchmen, awake while others sleep. They write the vision down, climb to their duty post,
              and carry godly influence into government, the courts and the market place.
            </p>
            <blockquote className="border-l-2 border-brand pl-4 text-ink-900">
              “Watch and pray, that ye enter not into temptation.”
              <span className="mt-1 block text-sm text-ink-500">Matthew 26:41</span>
            </blockquote>
          </div>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
            {CH3.map((item, i) => (
              <figure key={item.src} className={clsx(i % 3 === 1 && "xl:mt-12", i % 3 === 2 && "xl:mt-24")}>
                <Tile item={item} sizes="(min-width: 1280px) 260px, (min-width: 640px) 45vw, 100vw" className="rounded-[var(--radius-card)]" />
                <figcaption>
                  <Caption item={item} />
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Chapter 4: big text-over-image cards (reference: "Stay cool with art") */}
      <section id="their-substance" className="wrap mt-32 scroll-mt-6" aria-labelledby="ch4-title">
        <div className="text-center">
          <Kicker a="Chapter 04" b="Ministering of their substance" center />
          <h2 id="ch4-title" className="mx-auto mt-5 max-w-3xl text-[2.1rem] leading-[1.05] uppercase sm:text-5xl lg:text-[3.4rem]">
            <span className="block sm:pr-[22%]">Out of their</span>
            <span className="block sm:pl-[24%]"><em className="normal-case">own means</em></span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg">
            And some, like Joanna and Susanna, carry the labourers: school fees, food, shelter, a van for the road. Needs
            met before they become a crisis.
          </p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { item: CH4[0]!, title: "Many others", accent: "who ministered", href: "/needs", cta: "Fund a need" },
            { item: CH4[1]!, title: "Take it off", accent: "their list", href: "/needs", cta: "See the needs" },
            { item: CH4[2]!, title: "The Lord", accent: "has provided", href: "/give", cta: "Give today" },
          ].map(({ item, title, accent, href, cta }, i) => (
            <article
              key={item.src}
              className={clsx(
                "relative isolate h-[420px] overflow-hidden rounded-[var(--radius-card)]",
                i === 2 && "sm:col-span-2 lg:col-span-1",
              )}
            >
              <Tile item={item} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="!absolute inset-0 -z-10" imageClassName="object-top" />
              <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-t from-night/90 via-night/40 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 p-6 text-center text-white">
                <p className="text-xs text-white/70">{item.caption}</p>
                <p className="mt-2 font-display text-3xl leading-tight">
                  {title} <em className="block font-serif italic">{accent}</em>
                </p>
                <Link
                  href={href}
                  className="pointer-events-auto mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-night hover:bg-aqua-50"
                >
                  {cta} <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Chapter 5: the end of the journey */}
      <section id="crowns" className="wrap mt-32 scroll-mt-6" aria-labelledby="ch5-title">
        <div className="grid gap-10 rounded-[var(--radius-panel)] bg-aqua-50 p-6 sm:p-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <Tile item={CH5} sizes="(min-width: 1024px) 520px, 100vw" className="rounded-[var(--radius-card)] shadow-[var(--shadow-card)]" />
          <div className="space-y-6">
            <Kicker a="Chapter 05" b="Crowns at His feet" />
            <Staggered id="ch5-title" first="Every labour," second={<em className="normal-case">laid at His feet</em>} />
            <p className="text-lg">
              The journey ends where it began: with Him. Every prayer, every gift, every mile travelled is cast before the
              throne by those who know the earth is the Lord’s, and the fulness thereof.
            </p>
            <blockquote className="border-l-2 border-brand pl-4 text-ink-900">
              “…and cast their crowns before the throne, saying, Thou art worthy, O Lord.”
              <span className="mt-1 block text-sm text-ink-500">Revelation 4:10–11</span>
            </blockquote>
          </div>
        </div>
      </section>

      {/* From the field: feature strip + photos */}
      <section id="from-the-field" className="mt-32 scroll-mt-6" aria-labelledby="field-title">
        <div className="bg-night py-12 text-white">
          <ul className="wrap grid grid-cols-2 gap-8 lg:grid-cols-4">
            {[
              { icon: HandHeart, title: "Prayer first", text: "No gift or service without a commitment to pray." },
              { icon: ShieldCheck, title: "Checked needs", text: "Every need confirmed by a field coordinator." },
              { icon: Sparkles, title: "Proof it was met", text: "Photos and thanks from the field for every giver." },
              { icon: Globe2, title: "Every nation", text: "Labourers in unreached territories across Africa." },
            ].map((f) => (
              <li key={f.title} className="text-center">
                <span className="mx-auto flex size-14 items-center justify-center rounded-full border border-white/25">
                  <f.icon className="size-6 text-aqua" aria-hidden />
                </span>
                <p className="mt-4 font-semibold">{f.title}</p>
                <p className="mt-1 text-sm text-white/65">{f.text}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="wrap mt-20">
          <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-end">
            <div>
              <Kicker a="Chapter 06" b="From the field" />
              <div className="mt-5">
                <Staggered id="field-title" first="The story" second={<em className="normal-case">goes on</em>} />
              </div>
            </div>
            <p className="text-lg lg:pb-2">
              The panels tell the calling; the field tells what happens next. Photos and testimonies from our labourers
              will fill this space as needs are met.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FIELD.map((item, i) => (
              <Tile
                key={item.src}
                item={item}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className={clsx("rounded-[var(--radius-card)]", i === 0 ? "h-80 sm:row-span-2 sm:h-full sm:min-h-[22rem]" : "h-64")}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Videos & bulletins */}
      <section className="wrap mt-24 grid gap-5 lg:grid-cols-2" aria-label="Videos and reports">
        <article className="rounded-[var(--radius-card)] bg-night p-8 text-white sm:p-10">
          <span className="flex size-12 items-center justify-center rounded-full bg-aqua text-night">
            <PlayCircle className="size-6" aria-hidden />
          </span>
          <h2 className="mt-6 text-3xl text-white">
            Video <em>dispatches</em>
          </h2>
          <p className="mt-3 text-white/75">
            Short testimonies from the field, made light enough to play on slow mobile connections. The first dispatches
            will appear here soon.
          </p>
        </article>
        <article className="rounded-[var(--radius-card)] bg-surface p-8 sm:p-10">
          <span className="flex size-12 items-center justify-center rounded-full bg-night text-white">
            <FileText className="size-5" aria-hidden />
          </span>
          <h2 className="mt-6 text-3xl">
            Quarterly <em>bulletins</em>
          </h2>
          <p className="mt-3">Field reports and prayer newsletters to download, print and share with your church.</p>
          <ul className="mt-6 divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
            {["Q1 2027 Harvest Bulletin", "Q4 2026 Harvest Bulletin"].map((r) => (
              <li key={r} className="flex items-center justify-between gap-4 px-5 py-4">
                <span className="flex items-center gap-3 font-medium text-ink-900">
                  <FileText className="size-4 text-brand" aria-hidden /> {r}
                </span>
                <span className="rounded-full bg-surface px-3 py-1 text-xs text-ink-500">Coming soon</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <div className="wrap mt-16 flex justify-center">
        <a href="#main" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 hover:text-ink-900">
          <ArrowDown className="size-4 rotate-180" aria-hidden /> Back to the beginning
        </a>
      </div>
    </StoryGallery>
  );
}
