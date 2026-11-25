import Image from "next/image";
import Link from "next/link";

import { site } from "@/config/site";

export function Footer() {
  return (
    <footer className="mt-24 bg-brand-900 text-brand-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Image
            src="/brand/logo-stacked.png"
            alt=""
            width={500}
            height={500}
            className="h-24 w-auto rounded-xl bg-white p-2"
          />
          <p className="font-display text-xl text-white">{site.tagline}</p>
        </div>
        <div>
          <h2 className="mb-3 font-sans text-sm font-semibold tracking-wide text-white uppercase">Explore</h2>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-white" href="/needs">Missionary needs</Link></li>
            <li><Link className="hover:text-white" href="/pray">Prayer network</Link></li>
            <li><Link className="hover:text-white" href="/give">Give</Link></li>
            <li><Link className="hover:text-white" href="/gallery">Illustrated scripture series</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 font-sans text-sm font-semibold tracking-wide text-white uppercase">Contact</h2>
          <ul className="space-y-2 text-sm">
            <li><a className="hover:text-white" href={`tel:${site.phone.replace(/\s/g, "")}`}>{site.phone}</a></li>
            <li><a className="hover:text-white" href={`mailto:${site.email}`}>{site.email}</a></li>
          </ul>
        </div>
        <div className="text-sm">
          <h2 className="mb-3 font-sans text-sm font-semibold tracking-wide text-white uppercase">Prayer hubs</h2>
          <p>Sydney · Lagos · New York · Vancouver</p>
          <p className="mt-2 text-brand-200">Around the clock, around the world.</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-brand-200">
        © {new Date().getFullYear()} {site.name}. Design preview: sample data.
      </div>
    </footer>
  );
}
