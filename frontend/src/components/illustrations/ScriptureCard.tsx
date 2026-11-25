import Image from "next/image";
import clsx from "clsx";

import type { Illustration } from "@/config/illustrations";

/** One panel from JLICI's illustrated scripture series (retained from the old site). */
export function ScriptureCard({
  item,
  sizes = "(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw",
  priority = false,
  caption = true,
  className,
}: {
  item: Illustration;
  sizes?: string;
  priority?: boolean;
  caption?: boolean;
  className?: string;
}) {
  return (
    <figure className={clsx("overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)]", className)}>
      <Image
        src={`/images/illustrations/${item.file}`}
        alt={item.alt}
        width={1080}
        height={1080}
        sizes={sizes}
        priority={priority}
        className="h-auto w-full"
      />
      {caption && (
        <figcaption className="px-4 py-3 text-sm">
          <span className="font-semibold text-brand-700">{item.reference}</span>
        </figcaption>
      )}
    </figure>
  );
}
