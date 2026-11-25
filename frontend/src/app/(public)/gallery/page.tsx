import type { Metadata } from "next";

import { ScriptureCard } from "@/components/illustrations/ScriptureCard";
import { illustrations } from "@/config/illustrations";

export const metadata: Metadata = {
  title: "Illustrated scripture series",
  description: "JLICI's illustrated series on the co-labourer's calling: prayer, watchfulness and giving.",
};

const GROUPS = [
  { theme: "giving", title: "Ministering of their substance" },
  { theme: "prayer", title: "Standing in the gap" },
  { theme: "watchman", title: "The watchman on the wall" },
  { theme: "calling", title: "The co-labourer's calling" },
] as const;

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-5xl font-semibold">Illustrated scripture series</h1>
      <p className="mt-3 max-w-2xl text-lg">
        Eighteen panels on what it means to labour together in Christ. Field photo albums and quarterly reports will join
        this page in the next preview.
      </p>

      {GROUPS.map((g) => (
        <section key={g.theme} className="mt-14" aria-labelledby={`g-${g.theme}`}>
          <h2 id={`g-${g.theme}`} className="mb-6 text-3xl">{g.title}</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {illustrations
              .filter((i) => i.theme === g.theme)
              .map((i) => (
                <ScriptureCard key={i.file} item={i} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
