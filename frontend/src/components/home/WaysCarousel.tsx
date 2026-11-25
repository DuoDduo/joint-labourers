"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Gift, HandHeart, HeartHandshake, Home, Users } from "lucide-react";

import { photos } from "@/config/photos";

/** JLICI's five tiers of care (from the original site's "Our Model"). */
const TIERS = [
  { tag: "Prayer", title: "Standing in the Gap", text: "Prayer for co-labourers: claim an hour and carry a missionary before the Lord.", href: "/pray", photo: photos.communityCare, icon: HandHeart },
  { tag: "Regular care", title: "Adopt-a-Missionary", text: "Regular or periodic care for a labourer and their family.", href: "/give", photo: photos.volunteersLagos, icon: Users },
  { tag: "Crowdfunding", title: "Contributive Support", text: "Many partners give toward one real, checked need until it is met.", href: "/needs", photo: photos.foodBoxes, icon: HeartHandshake },
  { tag: "One-off", title: "Gifts", text: "A one-off gift, in cash or in kind, where it's needed most.", href: "/give", photo: photos.aidPackages, icon: Gift },
  { tag: "Hospitality", title: "Transit Guest Accommodation", text: "Rest and shelter for labourers travelling between mission fields.", href: null, photo: photos.childrenMonrovia, icon: Home },
] as const;

export function WaysCarousel() {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("article");
    el.scrollBy({ left: dir * ((card?.clientWidth ?? 300) + 20), behavior: "smooth" });
  };

  return (
    <div>
      <div className="wrap flex justify-end gap-2">
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Previous"
          className="flex size-11 items-center justify-center rounded-full border border-ink-900/20 text-ink-900 hover:bg-surface"
        >
          <ArrowLeft className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="Next"
          className="flex size-11 items-center justify-center rounded-full bg-night text-white hover:bg-night-800"
        >
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>

      <div
        ref={track}
        className="mt-6 flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto scroll-smooth px-5 pb-4 [scrollbar-width:none] sm:scroll-px-8 sm:px-8 lg:scroll-px-[max(3rem,calc((100vw_-_90rem)/2_+_3rem))] lg:px-[max(3rem,calc((100vw_-_90rem)/2_+_3rem))] [&::-webkit-scrollbar]:hidden"
      >
        {TIERS.map((w) => (
          <article
            key={w.title}
            className="relative isolate flex h-[420px] w-[80vw] max-w-[320px] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[var(--radius-card)] p-6 text-white sm:w-[320px]"
          >
            <Image src={w.photo.src} alt={w.photo.alt} fill sizes="320px" className="-z-10 object-cover" />
            <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-night via-night/45 to-night/5" />
            <span className="absolute top-4 left-4 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              {w.tag}
            </span>
            <span className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white text-night">
              <w.icon className="size-5" aria-hidden />
            </span>
            <h3 className="text-2xl text-white">{w.title}</h3>
            <p className="mt-2 text-sm text-white/80">{w.text}</p>
            {w.href ? (
              <Link
                href={w.href}
                className="mt-5 inline-flex w-fit items-center gap-3 rounded-full bg-white py-1.5 pr-1.5 pl-4 text-sm font-semibold text-night"
              >
                Learn more
                <span className="flex size-8 items-center justify-center rounded-full bg-night text-white" aria-hidden>
                  <ArrowUpRight className="size-4" />
                </span>
              </Link>
            ) : (
              <span className="mt-5 text-sm text-white/60">Opening soon</span>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
