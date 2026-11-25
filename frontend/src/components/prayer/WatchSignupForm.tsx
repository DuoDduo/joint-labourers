"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { ApiError, apiSend } from "@/lib/api/client";
import type { PrayerHub, PrayerHubConfig, WatchDetail, WatchSignupResult } from "@/lib/api/types";
import { browserTimeZone, hubForZone } from "@/lib/time/hubs";
import { formatShift, toIcs } from "@/lib/time/watch";

const COUNTRIES = [
  { code: "NG", dial: "234", label: "🇳🇬 +234" },
  { code: "GH", dial: "233", label: "🇬🇭 +233" },
  { code: "LR", dial: "231", label: "🇱🇷 +231" },
  { code: "KE", dial: "254", label: "🇰🇪 +254" },
  { code: "ZA", dial: "27", label: "🇿🇦 +27" },
  { code: "GB", dial: "44", label: "🇬🇧 +44" },
  { code: "US", dial: "1", label: "🇺🇸/🇨🇦 +1" },
  { code: "AU", dial: "61", label: "🇦🇺 +61" },
];

const input =
  "mt-1.5 block min-h-12 w-full rounded-xl border border-line bg-surface px-4 font-normal text-ink-900 focus:border-brand focus:bg-white";

/** One-form sign-up for a prayer watch: details, hub, then one shift per round. */
export function WatchSignupForm({ watch, hubs }: { watch: WatchDetail; hubs: PrayerHubConfig[] }) {
  const [tz, setTz] = useState("Africa/Lagos");
  const [hub, setHub] = useState<PrayerHub>("LAGOS");
  const [dial, setDial] = useState("234");
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<WatchSignupResult | null>(null);

  useEffect(() => {
    const detected = browserTimeZone();
    setTz(detected);
    setHub(hubForZone(detected, hubs));
  }, [hubs]);

  const ics = useMemo(() => (done ? toIcs(done.watchTitle, done.slots) : ""), [done]);

  if (done) {
    return (
      <div className="space-y-5 text-center" role="status">
        <CheckCircle2 className="mx-auto size-14 text-brand" aria-hidden />
        <h2 className="text-3xl">Your watch is reserved</h2>
        <p>Thank you for standing in the gap. Here {done.slots.length === 1 ? "is your shift" : "are your shifts"}:</p>
        <ul className="mx-auto max-w-md space-y-2 text-left">
          {done.slots.map((s) => (
            <li key={s.startsAt} className="rounded-xl bg-surface px-4 py-3">
              <span className="block text-xs text-ink-500">{s.roundLabel}</span>
              <span className="font-semibold text-ink-900">{formatShift(s.startsAt, s.endsAt, tz)}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink-500">Times shown in {tz}.</p>
        <a
          href={`data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`}
          download="jlici-prayer-watch.ics"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-night px-5 font-semibold text-white hover:bg-night-800"
        >
          <CalendarPlus className="size-4" aria-hidden /> Add to my calendar
        </a>
      </div>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const local = String(f.get("phone") ?? "").replace(/\D/g, "").replace(/^0+/, "");
        setSaving(true);
        setError(null);
        try {
          const result = await apiSend<WatchSignupResult>(`/prayer/watches/${watch.slug}/signups`, "POST", {
            firstName: f.get("firstName"),
            lastName: f.get("lastName"),
            phone: `+${dial}${local}`,
            email: f.get("email"),
            hub,
            timezone: tz,
            slotIds: Object.values(picks).filter(Boolean),
            consent: f.get("consent") === "on",
          });
          setDone(result);
        } catch (err) {
          setError(err instanceof ApiError ? err.message : "Could not reserve. Please try again.");
        } finally {
          setSaving(false);
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-ink-900">
          First name <span className="text-give-700">*</span>
          <input name="firstName" required autoComplete="given-name" placeholder="First name" className={input} />
        </label>
        <label className="block text-sm font-semibold text-ink-900">
          Last name <span className="text-give-700">*</span>
          <input name="lastName" required autoComplete="family-name" placeholder="Last name" className={input} />
        </label>
      </div>

      <div className="text-sm font-semibold text-ink-900">
        <label htmlFor="phone">
          Phone number <span className="text-give-700">*</span>
        </label>
        <div className="mt-1.5 flex overflow-hidden rounded-xl border border-line bg-surface focus-within:border-brand focus-within:bg-white">
          <select
            aria-label="Country code"
            value={dial}
            onChange={(e) => setDial(e.target.value)}
            className="min-h-12 border-r border-line bg-transparent px-3 text-sm"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.dial}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="eg: 08012345678"
            className="min-h-12 flex-1 bg-transparent px-4 font-normal text-ink-900 outline-none"
          />
        </div>
      </div>

      <label className="block text-sm font-semibold text-ink-900">
        Email address <span className="text-give-700">*</span>
        <input name="email" type="email" required autoComplete="email" placeholder="eg: you@example.com" className={input} />
      </label>

      <label className="block text-sm font-semibold text-ink-900">
        Your prayer hub <span className="text-give-700">*</span>
        <select value={hub} onChange={(e) => setHub(e.target.value as PrayerHub)} className={input}>
          {hubs.map((h) => (
            <option key={h.hub} value={h.hub}>
              {h.displayName}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="space-y-4 border-t border-line pt-6">
        <legend className="pt-6 text-lg font-semibold text-ink-900">Prayer watch calendar</legend>
        <p className="text-sm text-ink-500">
          {watch.rounds.length > 1 ? "Choose one in each list." : "Choose your shift."} Times are shown in your time zone ({tz}).
        </p>
        {watch.rounds.map((r) => (
          <label key={r.id} className="block text-sm font-semibold text-ink-900">
            {r.label} {r.isRequired && <span className="text-give-700">*</span>}
            <select
              required={r.isRequired}
              value={picks[r.id] ?? ""}
              onChange={(e) => setPicks((p) => ({ ...p, [r.id]: e.target.value }))}
              className={input}
            >
              <option value="">Select…</option>
              {r.slots.map((s) => (
                <option key={s.id} value={s.id} disabled={s.isFull}>
                  {formatShift(s.startsAt, s.endsAt, tz)}
                  {s.isFull ? " · full" : s.taken > 0 ? ` · ${s.taken} praying` : ""}
                </option>
              ))}
            </select>
          </label>
        ))}
      </fieldset>

      <label className="flex gap-3 text-sm">
        <input type="checkbox" name="consent" required className="mt-0.5 size-4" />
        <span>I'm happy for JLICI to contact me about my prayer watch.</span>
      </label>

      {error && (
        <p role="alert" className="rounded-xl bg-give-50 px-4 py-3 text-sm font-semibold text-give-700">
          {error}
        </p>
      )}

      <Button type="submit" variant="night" size="lg" arrow className="w-full" disabled={saving}>
        {saving ? "Reserving…" : "Reserve my shift"}
      </Button>
    </form>
  );
}
