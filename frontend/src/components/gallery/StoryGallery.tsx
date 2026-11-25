"use client";

import Image from "next/image";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import clsx from "clsx";

export type GalleryItem = {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  placeholder?: boolean;
};

const OpenContext = createContext<(src: string) => void>(() => {});

/** Wraps the story page: any <Tile> inside opens the shared lightbox, in story order. */
export function StoryGallery({ items, children }: { items: GalleryItem[]; children: ReactNode }) {
  const [open, setOpen] = useState<number | null>(null);
  const openSrc = useCallback(
    (src: string) => {
      const i = items.findIndex((it) => it.src === src);
      if (i >= 0) setOpen(i);
    },
    [items],
  );

  return (
    <OpenContext.Provider value={openSrc}>
      {children}
      {open !== null && items[open] && (
        <Lightbox items={items} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
      )}
    </OpenContext.Provider>
  );
}

/** A clickable picture that opens the lightbox. */
export function Tile({
  item,
  sizes,
  className,
  imageClassName,
  fill = false,
  children,
}: {
  item: GalleryItem;
  sizes: string;
  className?: string;
  imageClassName?: string;
  fill?: boolean;
  children?: ReactNode;
}) {
  const open = useContext(OpenContext);
  return (
    <button
      type="button"
      onClick={() => open(item.src)}
      aria-label={`View full size: ${item.caption}`}
      // w-full: a block-level <button> shrinks to its content unless told to fill its column
      className={clsx("group relative block w-full overflow-hidden text-left", className)}
    >
      {fill ? (
        <Image
          src={item.src}
          alt={item.alt}
          fill
          sizes={sizes}
          className={clsx("object-cover transition-transform duration-700 group-hover:scale-[1.04]", imageClassName)}
        />
      ) : (
        <Image
          src={item.src}
          alt={item.alt}
          width={item.width}
          height={item.height}
          sizes={sizes}
          className={clsx("h-auto w-full transition-transform duration-700 group-hover:scale-[1.04]", imageClassName)}
        />
      )}
      <span
        aria-hidden
        className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-white/90 text-night opacity-0 shadow transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        <Expand className="size-4" />
      </span>
      {item.placeholder && (
        <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-night">
          Sample photo
        </span>
      )}
      {children}
    </button>
  );
}

function Lightbox({
  items,
  index,
  onIndex,
  onClose,
}: {
  items: GalleryItem[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const item = items[index]!;
  const closeBtn = useRef<HTMLButtonElement>(null);
  const prev = useCallback(() => onIndex((index - 1 + items.length) % items.length), [index, items.length, onIndex]);
  const next = useCallback(() => onIndex((index + 1) % items.length), [index, items.length, onIndex]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      opener?.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.caption}
      className="fixed inset-0 z-50 flex flex-col bg-night/95 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white sm:px-6">
        <span className="tabular text-sm text-white/70">
          {index + 1} / {items.length}
        </span>
        <button
          ref={closeBtn}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex size-11 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-14 sm:px-20"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <Image
          key={item.src}
          src={item.src}
          alt={item.alt}
          width={item.width}
          height={item.height}
          sizes="90vw"
          priority
          className="h-auto max-h-full w-auto max-w-full rounded-2xl object-contain"
        />
        <button
          type="button"
          onClick={prev}
          aria-label="Previous"
          className="absolute left-2 flex size-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-5"
        >
          <ChevronLeft className="size-6" aria-hidden />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next"
          className="absolute right-2 flex size-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-5"
        >
          <ChevronRight className="size-6" aria-hidden />
        </button>
      </div>
      <div className="px-4 py-4 text-center text-white sm:px-6">
        <p className="font-display text-lg">{item.caption}</p>
        <p className="mx-auto mt-1 max-w-2xl text-sm text-white/65">{item.alt}</p>
      </div>
    </div>
  );
}
