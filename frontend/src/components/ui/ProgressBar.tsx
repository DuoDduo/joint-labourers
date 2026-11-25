import clsx from "clsx";

export function ProgressBar({
  percent,
  label,
  size = "md",
}: {
  percent: number;
  label: string;
  size?: "sm" | "md";
}) {
  const funded = percent >= 100;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={label}
      className={clsx("w-full overflow-hidden rounded-full bg-brand-100", size === "sm" ? "h-2" : "h-3")}
    >
      <div
        className={clsx("h-full rounded-full transition-[width] duration-700", funded ? "bg-gold" : "bg-aqua")}
        style={{ width: `${Math.min(100, Math.max(percent, percent > 0 ? 3 : 0))}%` }}
      />
    </div>
  );
}
