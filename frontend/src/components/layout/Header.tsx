import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import { mainNav } from "@/config/site";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:h-20">
        <Link href="/" className="shrink-0" aria-label="Joint Labourers In Christ Int'l, home">
          <Image
            src="/brand/logo-horizontal.png"
            alt="Joint Labourers In Christ Int'l"
            width={866}
            height={288}
            priority
            className="h-10 w-auto sm:h-12"
          />
        </Link>

        <nav aria-label="Main" className="ml-auto hidden items-center gap-1 lg:flex">
          {mainNav.map((item) =>
            "soon" in item && item.soon ? (
              <span
                key={item.href}
                className="cursor-default rounded-full px-3 py-2 text-sm text-ink-500"
                title="Coming in the next preview"
              >
                {item.label}
              </span>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-2 text-sm font-medium text-ink-900 hover:bg-brand-50 hover:text-brand"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <ButtonLink href="/give" variant="give" className="ml-auto lg:ml-2">
          Give
        </ButtonLink>

        <details className="relative lg:hidden">
          <summary
            className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full hover:bg-brand-50"
            aria-label="Open menu"
          >
            <Menu className="size-6 text-ink-900" aria-hidden />
          </summary>
          <nav
            aria-label="Mobile"
            className="absolute right-0 mt-2 w-64 rounded-[var(--radius-card)] border border-line bg-white p-2 shadow-[var(--shadow-card)]"
          >
            {mainNav.map((item) =>
              "soon" in item && item.soon ? (
                <span key={item.href} className="block px-3 py-3 text-ink-500">
                  {item.label} <span className="text-xs">(soon)</span>
                </span>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-3 py-3 font-medium text-ink-900 hover:bg-brand-50"
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
