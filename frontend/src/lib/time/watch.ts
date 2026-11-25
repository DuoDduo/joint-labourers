/** Formatting helpers for prayer-watch shifts, always in the viewer's own time zone. */

const DAY = 86_400_000;

export function isMultiDay(startsAt: string, endsAt: string): boolean {
  return new Date(endsAt).getTime() - new Date(startsAt).getTime() >= DAY;
}

/** "Sat 30 Jan · 07:00 – 10:00" for shifts, "1st – 3rd Feb" for multi-day fasts. */
export function formatShift(startsAt: string, endsAt: string, tz: string): string {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (isMultiDay(startsAt, endsAt)) {
    const lastDay = new Date(end.getTime() - 1); // end is exclusive
    const d = (x: Date) => ordinal(Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, day: "numeric" }).format(x)));
    const month = new Intl.DateTimeFormat("en-GB", { timeZone: tz, month: "short" }).format(lastDay);
    return `${d(start)} – ${d(lastDay)} ${month}`;
  }
  const day = new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", day: "numeric", month: "short" }).format(start);
  const t = (x: Date) =>
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(x);
  return `${day} · ${t(start)} – ${t(end)}`;
}

export function formatRange(startsAt: string, endsAt: string, tz: string): string {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: tz, day: "numeric", month: "long", year: "numeric" });
  const a = f.format(new Date(startsAt));
  const b = f.format(new Date(new Date(endsAt).getTime() - 1));
  return a === b ? a : `${a} – ${b}`;
}

function ordinal(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : (["th", "st", "nd", "rd"][n % 10] ?? "th");
  return `${n}${s}`;
}

/** Minimal iCalendar file so people can add their shifts to any calendar app. */
export function toIcs(title: string, slots: { roundLabel: string; startsAt: string; endsAt: string }[]): string {
  const stamp = (d: string) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const now = stamp(new Date().toISOString());
  const clean = (s: string) => s.replace(/[,;\\]/g, " ");
  const events = slots.map((s, i) =>
    [
      "BEGIN:VEVENT",
      `UID:${stamp(s.startsAt)}-${i}@jointlabourers.org`,
      `DTSTAMP:${now}`,
      `DTSTART:${stamp(s.startsAt)}`,
      `DTEND:${stamp(s.endsAt)}`,
      `SUMMARY:${clean(title)} (${clean(s.roundLabel)})`,
      "DESCRIPTION:Joint Labourers In Christ Int'l prayer watch",
      "END:VEVENT",
    ].join("\r\n"),
  );
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//JLICI//Prayer Watch//EN", ...events, "END:VCALENDAR"].join("\r\n");
}
