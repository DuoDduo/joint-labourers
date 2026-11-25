import Image from "next/image";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/Button";
import { site } from "@/config/site";

export function Footer() {
  return (
    <footer className="mt-24">
      <div className="relative overflow-hidden rounded-t-[var(--radius-panel)] bg-night text-white">
        <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-32 size-[26rem] rounded-full bg-brand/30 blur-3xl" />
        <div className="wrap relative py-14">
          <div className="flex flex-wrap items-end justify-between gap-8 border-b border-white/10 pb-12">
            <div className="max-w-3xl space-y-5">
              <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-white/85 uppercase">
                <span className="size-2 rounded-full bg-aqua" aria-hidden /> Labour with us
              </p>
              <h2 className="text-4xl leading-tight text-white sm:text-5xl">
                The Lord of the Harvest is counting on you, <em>yield your vessel today!</em>
              </h2>
              <blockquote className="border-l-2 border-aqua pl-4 text-white/75">
                “Gather my saints together unto me; those that have made a covenant with me by sacrifice.”
                <span className="mt-1 block text-sm text-white/55">Psalm 50:5</span>
              </blockquote>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/needs" variant="accent" size="lg" arrow>Fund a need</ButtonLink>
              <ButtonLink href="/pray" variant="outline-light" size="lg">Claim a prayer hour</ButtonLink>
            </div>
          </div>

          <div className="grid gap-10 pt-12 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="flex size-12 items-center justify-center rounded-full bg-white">
                  <Image src="/brand/logo-mark.png" alt="" width={512} height={512} className="size-10" />
                </span>
                <span className="font-display text-xl font-semibold">Joint Labourers</span>
              </div>
              <p className="text-sm text-white/65">{site.tagline}</p>
            </div>
            <FooterList title="Explore" links={[["/needs", "Missionary needs"], ["/pray", "Prayer network"], ["/give", "Give"], ["/gallery", "Illustrated series"]]} />
            <div>
              <h3 className="mb-3 font-sans text-sm font-semibold tracking-wide text-white uppercase">Contact</h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a className="hover:text-aqua" href={`tel:${site.phone.replace(/\s/g, "")}`}>{site.phone}</a></li>
                <li><a className="hover:text-aqua" href={`mailto:${site.email}`}>{site.email}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 font-sans text-sm font-semibold tracking-wide text-white uppercase">Prayer hubs</h3>
              <p className="text-sm text-white/70">Sydney · Lagos · New York · Vancouver</p>
              <p className="mt-1 text-sm text-white/45">Around the clock, around the world.</p>
            </div>
          </div>
          <p className="mt-12 text-xs text-white/45">
            © {new Date().getFullYear()} {site.name}. Design preview: sample data and placeholder photos.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterList({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="mb-3 font-sans text-sm font-semibold tracking-wide text-white uppercase">{title}</h3>
      <ul className="space-y-2 text-sm text-white/70">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link className="hover:text-aqua" href={href}>{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
