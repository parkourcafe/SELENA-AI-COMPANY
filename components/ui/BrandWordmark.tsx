import { cn } from "@/lib/cn";

export function BrandWordmark({
  tone = "dark",
  size = "md",
}: {
  tone?: "dark" | "light";
  size?: "md" | "lg";
}) {
  const light = tone === "light";

  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-2 leading-none",
        light ? "text-ivory" : "text-ink",
      )}
    >
      <span
        className={cn(
          "font-serif font-semibold",
          size === "lg" ? "text-3xl" : "text-2xl",
        )}
      >
        Selena
      </span>
      <span
        className={cn(
          "font-sans text-[0.66rem] font-semibold uppercase tracking-[0.24em]",
          light ? "text-ivory/62" : "text-muted",
        )}
      >
        Systems
      </span>
      <span className="h-1.5 w-1.5 rounded-full bg-copper" aria-hidden />
    </span>
  );
}
