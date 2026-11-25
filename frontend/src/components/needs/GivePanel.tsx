"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import clsx from "clsx";

import { Button } from "@/components/ui/Button";
import type { NeedDetail } from "@/lib/api/types";
import { formatMinor } from "@/lib/money/format";

const PRESETS_MAJOR = [10_000, 25_000, 50_000];

export function GivePanel({ need }: { need: NeedDetail }) {
  const router = useRouter();
  const available = BigInt(need.availableMinor);
  const options = useMemo(() => {
    const quarter = (BigInt(need.targetMinor) / 4n / 100_000n) * 100_000n; // round to ₦1,000
    const half = (BigInt(need.targetMinor) / 2n / 100_000n) * 100_000n;
    return [
      ...PRESETS_MAJOR.map((m) => ({ label: formatMinor((BigInt(m) * 100n).toString(), need.currency), minor: BigInt(m) * 100n })),
      { label: "25%", minor: quarter },
      { label: "50%", minor: half },
      { label: "Fund the remainder", minor: available },
    ].filter((o) => o.minor > 0n && o.minor <= available);
  }, [need, available]);

  const [selected, setSelected] = useState<bigint | null>(options[0]?.minor ?? null);
  const [custom, setCustom] = useState("");
  const amount = custom ? BigInt(Math.round(Number(custom) || 0)) * 100n : selected;
  const tooMuch = amount !== null && amount > available;
  const tooLittle = amount !== null && amount < 100_000n; // ₦1,000 minimum

  if (need.percent >= 100 || available === 0n) {
    return (
      <div className="rounded-[var(--radius-card)] border border-gold bg-gold-50 p-6 text-center">
        <p className="font-display text-2xl text-ink-900">Fully funded. Thank you!</p>
        <p className="mt-2 text-sm">Every gift has been received for this need. See other open needs below.</p>
      </div>
    );
  }

  return (
    <form
      className="space-y-5 rounded-[var(--radius-card)] border border-line bg-white p-6 shadow-[var(--shadow-card)]"
      onSubmit={(e) => {
        e.preventDefault();
        if (!amount || tooMuch || tooLittle) return;
        router.push(`/give?need=${need.code}&amount=${amount.toString()}`);
      }}
    >
      <div>
        <p className="font-display text-2xl text-ink-900">Give toward {need.code}</p>
        <p className="tabular mt-1 text-sm">
          <strong className="text-give-700">{formatMinor(need.availableMinor, need.currency)}</strong> still needed
        </p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink-900">Choose an amount</legend>
        <div className="grid grid-cols-6 gap-2">
          {options.map((o) => (
            <button
              type="button"
              key={o.label}
              aria-pressed={!custom && selected === o.minor}
              onClick={() => {
                setSelected(o.minor);
                setCustom("");
              }}
              className={clsx(
                "min-h-11 rounded-full border-2 px-3 text-sm font-semibold transition-colors",
                !custom && selected === o.minor
                  ? "border-brand bg-brand text-white"
                  : "border-line text-ink-900 hover:border-brand",
                // fixed amounts: 3 per row · percentages: 2 per row · remainder: full row
                o.label === "Fund the remainder"
                  ? "col-span-6"
                  : o.label.endsWith("%")
                    ? "col-span-3"
                    : "col-span-2",
              )}
            >
              {o.label}
              {o.label.endsWith("%") || o.label.startsWith("Fund") ? (
                <span className="ml-1 font-normal opacity-80">· {formatMinor(o.minor.toString(), need.currency)}</span>
              ) : null}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="text-sm font-semibold text-ink-900">Or another amount (₦)</span>
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          value={custom}
          onChange={(e) => setCustom(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="e.g. 15000"
          className="mt-1 block min-h-11 w-full rounded-lg border border-line px-3 text-ink-900 focus:border-brand"
          aria-describedby="amount-help"
        />
      </label>
      <p id="amount-help" className="text-xs text-ink-500" aria-live="polite">
        {tooMuch
          ? `That's more than is still needed. The most you can give here is ${formatMinor(need.availableMinor, need.currency)}.`
          : tooLittle
            ? "The smallest gift is ₦1,000."
            : "If this need is completed before your gift clears, your gift goes to the Missionary Care Fund."}
      </p>

      <Button type="submit" variant="give" size="lg" className="w-full" disabled={!amount || tooMuch || tooLittle}>
        Continue{amount && !tooMuch && !tooLittle ? ` · ${formatMinor(amount.toString(), need.currency)}` : ""}
      </Button>
    </form>
  );
}
