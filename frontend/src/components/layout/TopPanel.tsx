import Image from "next/image";
import clsx from "clsx";
import type { ReactNode } from "react";

import { Header } from "@/components/layout/Header";

type Photo = { src: string; alt: string };

/**
 * The rounded hero frame at the top of every page. With `photo`, the image fills the
 * frame under an indigo overlay (as in the reference); without it, the frame is plain night.
 * The white navigation bar floats at the top.
 */
export function TopPanel({
  children,
  photo,
  photoPosition = "50% 40%",
  className,
}: {
  children?: ReactNode;
  photo?: Photo;
  photoPosition?: string;
  className?: string;
}) {
  return (
    <div>
      <div className={clsx("relative isolate overflow-hidden rounded-b-[var(--radius-panel)] bg-night text-white", className)}>
        {photo ? (
          <>
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              priority
              sizes="100vw"
              className="-z-10 object-cover"
              style={{ objectPosition: photoPosition }}
            />
            <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-night/95 via-night/75 to-night/20" />
            <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-night/80 to-transparent" />
          </>
        ) : (
          <div aria-hidden className="pointer-events-none absolute -top-40 -right-40 -z-10 size-[28rem] rounded-full bg-brand/30 blur-3xl" />
        )}
        <Header />
        <div className="relative mx-auto max-w-[90rem]">{children}</div>
      </div>
    </div>
  );
}

/** Small label with a dot, e.g. "• ABOUT JLICI". */
export function Eyebrow({ children, onDark = false }: { children: ReactNode; onDark?: boolean }) {
  return (
    <p
      className={clsx(
        "flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase",
        onDark ? "text-white/85" : "text-ink-900",
      )}
    >
      <span className={clsx("size-2 rounded-full", onDark ? "bg-aqua" : "bg-brand")} aria-hidden />
      {children}
    </p>
  );
}

/** Standard page hero inside the TopPanel (for inner pages). */
export function PageIntro({
  eyebrow,
  title,
  children,
  aside,
}: {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="grid items-end gap-8 px-5 pt-10 pb-12 sm:px-8 sm:pt-16 sm:pb-16 lg:grid-cols-[1fr_auto] lg:px-12">
      <div className="max-w-3xl space-y-5">
        {eyebrow && <Eyebrow onDark>{eyebrow}</Eyebrow>}
        <h1 className="text-4xl leading-[1.05] text-white sm:text-6xl">{title}</h1>
        {children && <div className="max-w-2xl text-lg text-white/75">{children}</div>}
      </div>
      {aside}
    </div>
  );
}
