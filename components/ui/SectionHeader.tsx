import { cn } from "@/lib/cn";
import { Eyebrow } from "@/components/ui/Badge";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Editorial section opener: eyebrow + large serif headline + optional intro.
 * Keeps rhythm consistent across all sections and pages.
 */
export function SectionHeader({
  eyebrow,
  headline,
  intro,
  onDark = false,
  align = "left",
  className,
}: {
  eyebrow?: string;
  headline: string;
  intro?: string;
  onDark?: boolean;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <Eyebrow onDark={onDark} className={align === "center" ? "justify-center" : undefined}>
          {eyebrow}
        </Eyebrow>
      ) : null}
      <h2 className={cn("text-h2", onDark ? "text-ivory" : "text-ink")}>{headline}</h2>
      {intro ? (
        <p className={cn("mt-5 text-lg leading-relaxed", onDark ? "text-ivory/70" : "text-muted")}>
          {intro}
        </p>
      ) : null}
    </Reveal>
  );
}
