"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Phone } from "lucide-react";
import clsx from "clsx";

import { ButtonLink } from "@/components/ui/Button";
import { mainNav, site } from "@/config/site";

/** Floating white navigation bar that sits over the hero photo. */
export function Header() {
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const links = [{ href: "/", label: "Home" }, ...mainNav];

  return (
    <header className="relative z-40 px-3 pt-3 sm:px-6 sm:pt-5 lg:px-10">
      <div className="mx-auto flex max-w-[88rem] items-center gap-3 rounded-2xl bg-white py-2 pr-2 pl-3 shadow-[0_8px_30px_rgb(0_0_0/0.12)] sm:pl-4">
        <Link href="/" className="shrink-0" aria-label="Joint Labourers In Christ Int'l, home">
          <Image
            src="/brand/logo-horizontal.png"
            alt="Joint Labourers In Christ Int'l"
            width={866}
            height={288}
            priority
            className="h-9 w-auto sm:h-10"
          />
        </Link>

        <nav aria-label="Main" className="ml-4 hidden items-center gap-0.5 lg:flex">
          {links.map((item) =>
            "soon" in item && item.soon ? (
              <span
                key={item.href}
                className="hidden cursor-default rounded-full px-3 py-1.5 text-sm whitespace-nowrap text-ink-500/60 xl:inline"
                title="Coming in the next preview"
              >
                {item.label}
              </span>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={clsx(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                  isActive(item.href) ? "bg-aqua-100 text-night" : "text-ink-900 hover:bg-surface",
                )}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <a
          href={`tel:${site.phone.replace(/\s/g, "")}`}
          className="ml-auto hidden items-center gap-2.5 md:flex"
          aria-label={`Call us on ${site.phone}`}
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-aqua-100 text-night">
            <Phone className="size-4" aria-hidden />
          </span>
          <span className="text-xs leading-tight text-ink-500">
            Call us
            <span className="block text-sm font-semibold whitespace-nowrap text-ink-900">{site.phone}</span>
          </span>
        </a>

        <ButtonLink href="/give" variant="night" arrow className="ml-auto md:ml-3">
          Give
        </ButtonLink>

        <details className="relative lg:hidden">
          <summary
            className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full bg-surface hover:bg-line"
            aria-label="Open menu"
          >
            <Menu className="size-5 text-ink-900" aria-hidden />
          </summary>
          <nav
            aria-label="Mobile"
            className="absolute right-0 mt-3 w-64 rounded-2xl border border-line bg-white p-2 shadow-[var(--shadow-card)]"
          >
            {links.map((item) =>
              "soon" in item && item.soon ? (
                <span key={item.href} className="block px-3 py-3 text-ink-500">
                  {item.label} <span className="text-xs">(soon)</span>
                </span>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "block rounded-xl px-3 py-3 font-medium",
                    isActive(item.href) ? "bg-aqua-100 text-night" : "text-ink-900 hover:bg-surface",
                  )}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>
        </details>
      </div>
    </header>
  );
}
