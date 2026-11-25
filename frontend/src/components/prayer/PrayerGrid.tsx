"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

import { Button } from "@/components/ui/Button";
import { ApiError, apiSend } from "@/lib/api/client";
import type { CoverageCell, PrayerHub, PrayerHubConfig } from "@/lib/api/types";
import { WEEKDAYS, browserTimeZone, hubForZone, utcCellToLocal } from "@/lib/time/hubs";

type Claim = { weekday: number; hour: number } | null;

/** 7×24 coverage heatmap in the viewer's chosen time zone, with "claim this hour". */
export function PrayerGrid({ hubs, coverage }: { hubs: PrayerHubConfig[]; coverage: CoverageCell[] }) {
  const [tz, setTz] = useState("Africa/Lagos");
  const [myTz, setMyTz] = useState("Africa/Lagos");
  const [day, setDay] = useState(0);
  const [claim, setClaim] = useState<Claim>(null);
  const [extra, setExtra] = useState<Record<string, number>>({});

  useEffect(() => {
    const detected = browserTimeZone();
    setMyTz(detected);
    setTz(detected);
    setDay(new Date().getDay());
  }, []);

  const grid = useMemo(() => {
    const g = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
    for (const c of coverage) {
      const { weekday, hour } = utcCellToLocal(c.weekdayUtc, c.hourUtc, tz);
      g[weekday]![hour]! += c.count;
    }
    for (const [key, n] of Object.entries(extra)) {
      const [w, h] = key.split("-").map(Number) as [number, number];
      g[w]![h]! += n;
    }
    return g;
  }, [coverage, tz, extra]);

  const covered = grid.flat().filter((n) => n > 0).length;
  const zones = [
    { label: `My time (${myTz})`, tz: myTz },
    ...hubs.filter((h) => h.timezone !== myTz).map((h) => ({ label: h.displayName, tz: h.timezone })),
  ];

  return (
    <section aria-labelledby="grid-title" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="grid-title" className="text-3xl">
            Claim a weekly prayer hour
          </h2>
          <p className="mt-1">
            <strong className="tabular text-ink-900">{covered} of 168</strong> hours a week have someone praying. Orange
            outlines are gaps.
          </p>
        </div>
        <label className="text-sm">
          <span className="mb-1 block font-semibold text-ink-900">Show times in</span>
          <select
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            className="min-h-11 rounded-lg border border-line bg-white px-3 text-ink-900"
          >
            {zones.map((z) => (
              <option key={z.tz} value={z.tz}>
                {z.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Mobile: one day at a time */}
      <div className="flex gap-1 overflow-x-auto md:hidden" role="tablist" aria-label="Day">
        {WEEKDAYS.map((d, i) => (
          <button
            key={d}
            role="tab"
            aria-selected={day === i}
            onClick={() => setDay(i)}
            className={clsx(
              "min-h-11 min-w-12 rounded-full px-3 text-sm font-semibold",
              day === i ? "bg-brand text-white" : "bg-surface text-ink-900",
            )}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:hidden">
        {grid[day]!.map((n, h) => (
          <Cell key={h} n={n} label={`${WEEKDAYS[day]} ${pad(h)}:00`} onClick={() => setClaim({ weekday: day, hour: h })}>
            {pad(h)}:00
          </Cell>
        ))}
      </div>

      {/* Desktop: full week */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-separate border-spacing-0.5 text-xs">
          <thead>
            <tr>
              <th className="w-12" />
              {Array.from({ length: 24 }, (_, h) => (
                <th key={h} scope="col" className="tabular font-normal text-ink-500">
                  {pad(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, w) => (
              <tr key={w}>
                <th scope="row" className="pr-2 text-right font-semibold text-ink-900">
                  {WEEKDAYS[w]}
                </th>
                {row.map((n, h) => (
                  <td key={h} className="p-0">
                    <Cell
                      n={n}
                      label={`${WEEKDAYS[w]} ${pad(h)}:00, ${n} praying`}
                      onClick={() => setClaim({ weekday: w, hour: h })}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <Legend />
      </div>

      {claim && (
        <ClaimForm
          claim={claim}
          tz={tz}
          defaultHub={hubForZone(tz, hubs)}
          hubs={hubs}
          onClose={() => setClaim(null)}
          onDone={() => {
            setExtra((e) => ({ ...e, [`${claim.weekday}-${claim.hour}`]: (e[`${claim.weekday}-${claim.hour}`] ?? 0) + 1 }));
          }}
        />
      )}
    </section>
  );
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function Cell({ n, label, onClick, children }: { n: number; label: string; onClick: () => void; children?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label}. Claim this hour`}
      className={clsx(
        "tabular flex w-full items-center justify-center rounded-md text-[11px] font-semibold transition-transform hover:scale-110",
        children ? "min-h-11" : "aspect-square min-h-6",
        n === 0 && "border-2 border-dashed border-give bg-white text-give-700",
        n > 0 && n < 3 && "bg-aqua-200 text-brand-900",
        n >= 3 && "bg-brand text-white",
      )}
    >
      {children ?? (n > 0 ? n : "")}
    </button>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap gap-4 text-xs">
      <span className="flex items-center gap-1.5"><span className="size-4 rounded border-2 border-dashed border-give" /> Gap</span>
      <span className="flex items-center gap-1.5"><span className="size-4 rounded bg-aqua-200" /> 1–2 praying</span>
      <span className="flex items-center gap-1.5"><span className="size-4 rounded bg-brand" /> 3 or more</span>
    </div>
  );
}

function ClaimForm({
  claim,
  tz,
  defaultHub,
  hubs,
  onClose,
  onDone,
}: {
  claim: NonNullable<Claim>;
  tz: string;
  defaultHub: PrayerHub;
  hubs: PrayerHubConfig[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [state, setState] = useState<"idle" | "saving" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Focus the first field on open, close on Escape, keep Tab inside the dialog,
  // and give focus back to the hour that opened it.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    formRef.current?.querySelector<HTMLElement>("input, select, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key !== "Tab" || !formRef.current) return;
      const items = formRef.current.querySelectorAll<HTMLElement>("input, select, button:not([disabled])");
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 p-4 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        ref={formRef}
        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setState("saving");
          setError(null);
          try {
            await apiSend("/prayer/commitments", "POST", {
              fullName: f.get("fullName"),
              email: f.get("email") || null,
              phone: f.get("phone") || null,
              hub: f.get("hub"),
              timezone: tz,
              localWeekday: claim.weekday,
              localHour: claim.hour,
              consent: f.get("consent") === "on",
            });
            setState("done");
            onDone();
          } catch (err) {
            setState("idle");
            setError(err instanceof ApiError ? err.message : "Could not save. Please try again.");
          }
        }}
      >
        {state === "done" ? (
          <div className="space-y-3 text-center">
            <p id="claim-title" className="font-display text-3xl text-ink-900">Thank you!</p>
            <p>
              You hold <strong>every {WEEKDAYS[claim.weekday]} at {pad(claim.hour)}:00</strong> ({tz}). A reminder email
              arrives 30 minutes before each week (switched on in a later sprint).
            </p>
            <Button type="button" onClick={onClose} className="w-full">Done</Button>
          </div>
        ) : (
          <>
            <p id="claim-title" className="font-display text-2xl text-ink-900">
              Every {WEEKDAYS[claim.weekday]} at {pad(claim.hour)}:00
            </p>
            <p className="-mt-2 text-sm text-ink-500">{tz}</p>
            <Field name="fullName" label="Your name" required />
            <Field name="email" label="Email" type="email" />
            <Field name="phone" label="WhatsApp number (optional)" type="tel" />
            <label className="block text-sm">
              <span className="font-semibold text-ink-900">Which hub do you pray with?</span>
              <select name="hub" defaultValue={defaultHub} className="mt-1 block min-h-11 w-full rounded-lg border border-line px-3">
                {hubs.map((h) => (
                  <option key={h.hub} value={h.hub}>{h.displayName}</option>
                ))}
              </select>
            </label>
            <label className="flex gap-2 text-sm">
              <input type="checkbox" name="consent" required className="mt-1 size-4" />
              <span>I'm happy for JLICI to remind me about my prayer hour.</span>
            </label>
            {error && <p role="alert" className="text-sm font-semibold text-give-700">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1" disabled={state === "saving"}>
                {state === "saving" ? "Saving…" : "Claim this hour"}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

function Field({ name, label, type = "text", required }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <label className="block text-sm">
      <span className="font-semibold text-ink-900">{label}</span>
      <input name={name} type={type} required={required} className="mt-1 block min-h-11 w-full rounded-lg border border-line px-3 text-ink-900" />
    </label>
  );
}
