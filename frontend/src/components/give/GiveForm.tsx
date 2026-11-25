"use client";

import { useState } from "react";
import clsx from "clsx";
import { Building2, CreditCard, Hash, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/Button";
import type { Currency } from "@/lib/api/types";
import { formatMinor } from "@/lib/money/format";

const PRESETS: Record<Currency, number[]> = {
  NGN: [10_000, 25_000, 50_000],
  USD: [25, 50, 100],
  GBP: [20, 50, 100],
  EUR: [25, 50, 100],
  CAD: [30, 60, 120],
  AUD: [30, 75, 150],
  KES: [2_000, 5_000, 10_000],
};

const METHODS: Record<Currency, { id: string; label: string; icon: typeof CreditCard }[]> = {
  NGN: [
    { id: "card", label: "Card", icon: CreditCard },
    { id: "ussd", label: "USSD", icon: Hash },
    { id: "transfer", label: "Bank transfer", icon: Building2 },
  ],
  USD: [{ id: "card", label: "Card", icon: CreditCard }, { id: "transfer", label: "Bank transfer", icon: Building2 }],
  GBP: [{ id: "card", label: "Card", icon: CreditCard }, { id: "transfer", label: "Bank transfer", icon: Building2 }],
  EUR: [{ id: "card", label: "Card", icon: CreditCard }],
  CAD: [{ id: "card", label: "Card", icon: CreditCard }],
  AUD: [{ id: "card", label: "Card", icon: CreditCard }],
  KES: [{ id: "mpesa", label: "M-Pesa", icon: Smartphone }, { id: "card", label: "Card", icon: CreditCard }],
};

const DESIGNATIONS = [
  { id: "GENERAL_FUND", label: "Where it's needed most" },
  { id: "MISSIONARY_SUPPORT", label: "Adopt a missionary (monthly)" },
  { id: "EMERGENCY_RELIEF", label: "Emergency field relief" },
  { id: "TRANSIT_HOUSING", label: "Transit housing" },
];

export function GiveForm({ needCode, needAmountMinor }: { needCode?: string; needAmountMinor?: string }) {
  const [step, setStep] = useState(1);
  const [frequency, setFrequency] = useState<"once" | "monthly">("once");
  const [currency, setCurrency] = useState<Currency>("NGN");
  const [major, setMajor] = useState<number>(needAmountMinor ? Number(BigInt(needAmountMinor) / 100n) : PRESETS.NGN[1]!);
  const [method, setMethod] = useState("card");
  const amountMinor = (BigInt(Math.max(0, Math.round(major))) * 100n).toString();

  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
      <ol className="mb-8 flex items-center gap-2 text-sm" aria-label="Steps">
        {["Amount", "Your details", "Payment"].map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2" aria-current={step === i + 1 ? "step" : undefined}>
            <span
              className={clsx(
                "flex size-8 shrink-0 items-center justify-center rounded-full font-semibold",
                step > i ? "bg-brand text-white" : "bg-surface text-ink-500",
              )}
            >
              {i + 1}
            </span>
            <span className={clsx("hidden sm:inline", step === i + 1 ? "font-semibold text-ink-900" : "text-ink-500")}>{label}</span>
            {i < 2 && <span className="h-px flex-1 bg-line" aria-hidden />}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <div className="space-y-6">
          {needCode ? (
            <p className="rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-900">
              Giving to need <strong>{needCode}</strong>. One-off gift.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 rounded-full bg-surface p-1" role="radiogroup" aria-label="How often">
                {(["once", "monthly"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    role="radio"
                    aria-checked={frequency === f}
                    onClick={() => setFrequency(f)}
                    className={clsx(
                      "min-h-11 rounded-full text-sm font-semibold",
                      frequency === f ? "bg-white text-brand shadow" : "text-ink-600",
                    )}
                  >
                    {f === "once" ? "One-time gift" : "Monthly partnership"}
                  </button>
                ))}
              </div>
              <label className="block text-sm">
                <span className="font-semibold text-ink-900">Where should it go?</span>
                <select className="mt-1 block min-h-11 w-full rounded-lg border border-line px-3">
                  {DESIGNATIONS.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </label>
            </>
          )}

          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Currency">
            {(Object.keys(PRESETS) as Currency[]).map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={currency === c}
                disabled={!!needCode && c !== "NGN"}
                onClick={() => {
                  setCurrency(c);
                  setMajor(PRESETS[c][1]!);
                  setMethod(METHODS[c][0]!.id);
                }}
                className={clsx(
                  "min-h-11 rounded-full border-2 px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-35",
                  currency === c ? "border-brand bg-brand-50 text-brand-700" : "border-line text-ink-900",
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {PRESETS[currency].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setMajor(p)}
                aria-pressed={major === p}
                className={clsx(
                  "tabular min-h-14 rounded-xl border-2 text-lg font-semibold",
                  major === p ? "border-brand bg-brand text-white" : "border-line text-ink-900 hover:border-brand",
                )}
              >
                {formatMinor((BigInt(p) * 100n).toString(), currency)}
              </button>
            ))}
          </div>
          <label className="block text-sm">
            <span className="font-semibold text-ink-900">Other amount ({currency})</span>
            <input
              inputMode="numeric"
              value={major || ""}
              onChange={(e) => setMajor(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
              className="tabular mt-1 block min-h-11 w-full rounded-lg border border-line px-3 text-ink-900"
            />
          </label>
          <Button variant="give" size="lg" className="w-full" disabled={major <= 0} onClick={() => setStep(2)}>
            Continue · {formatMinor(amountMinor, currency)}
            {frequency === "monthly" && !needCode ? " / month" : ""}
          </Button>
        </div>
      )}

      {step === 2 && (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setStep(3);
          }}
        >
          <Input name="name" label="Full name" required autoComplete="name" />
          <Input name="email" label="Email (for your receipt)" type="email" autoComplete="email" />
          <Input name="phone" label="WhatsApp number (optional)" type="tel" autoComplete="tel" />
          <label className="flex gap-2 text-sm">
            <input type="checkbox" className="mt-1 size-4" /> Give anonymously (hide my name on the need page)
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-ink-900">A note or scripture for the missionary (optional)</span>
            <textarea rows={3} className="mt-1 block w-full rounded-lg border border-line p-3" />
          </label>
          <label className="flex gap-2 text-sm">
            <input type="checkbox" required className="mt-1 size-4" />
            <span>I'm happy for JLICI to contact me about my gift.</span>
          </label>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>Back</Button>
            <Button type="submit" className="flex-1">Continue</Button>
          </div>
        </form>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-ink-900">Pay with</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {METHODS[currency].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={method === m.id}
                  onClick={() => setMethod(m.id)}
                  className={clsx(
                    "flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 font-semibold",
                    method === m.id ? "border-brand bg-brand-50 text-brand-700" : "border-line text-ink-900",
                  )}
                >
                  <m.icon className="size-5" aria-hidden /> {m.label}
                </button>
              ))}
            </div>
          </fieldset>
          {method === "transfer" && (
            <p className="rounded-lg bg-surface p-4 text-sm">
              You'll get JLICI's account details and a reference like <strong className="font-mono">JLN-0042-8F3K</strong> to put in
              your transfer narration. We confirm your gift when it arrives.
            </p>
          )}
          <div className="rounded-lg border border-dashed border-give bg-give-50 p-4 text-sm text-ink-900" role="note">
            <strong>Design preview.</strong> Payments (Paystack and Flutterwave) are connected in Phase 4. No money is
            taken here.
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep(2)}>Back</Button>
            <Button type="button" variant="give" size="lg" className="flex-1" disabled>
              Give {formatMinor(amountMinor, currency)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ label, ...props }: { label: string } & React.ComponentProps<"input">) {
  return (
    <label className="block text-sm">
      <span className="font-semibold text-ink-900">
        {label}
        {props.required && <span className="text-give-700"> *</span>}
      </span>
      <input {...props} className="mt-1 block min-h-11 w-full rounded-lg border border-line px-3 text-ink-900" />
    </label>
  );
}
