import { cn } from "@/lib/cn";

/**
 * Small status pill / eyebrow label. `tone` maps to the palette:
 * copper for accents, sage for status, neutral for quiet metadata.
 */
export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "copper" | "sage" | "onDark";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium tracking-wide",
        tone === "neutral" && "border-line bg-surface text-muted",
        tone === "copper" && "border-copper/30 bg-copper/10 text-copper-deep",
        tone === "sage" && "border-sage/40 bg-sage/15 text-[#5f6b52]",
        tone === "onDark" && "border-line-dark bg-white/5 text-ivory/80",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Uppercase section eyebrow — editorial marker above headlines. */
export function Eyebrow({
  children,
  onDark = false,
  className,
}: {
  children: React.ReactNode;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "mb-4 flex items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-[0.22em]",
        onDark ? "text-copper" : "text-copper-deep",
        className,
      )}
    >
      <span className="inline-block h-px w-8 bg-current opacity-60" aria-hidden />
      {children}
    </p>
  );
}
