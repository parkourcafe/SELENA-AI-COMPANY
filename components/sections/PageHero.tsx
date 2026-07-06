import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Badge";

/**
 * Shared cinematic sub-page opener (contract §Section components).
 * Warm canvas + faint grid, editorial eyebrow, serif h1, optional intro
 * and a `children` slot for CTAs or extra elements. Entrance uses the
 * global drift-in keyframes (reduced motion handled in globals.css).
 */
export function PageHero({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="bg-warm-canvas relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-20">
      <div
        className="grid-texture pointer-events-none absolute -top-16 -right-40 hidden h-[34rem] w-[34rem] lg:block"
        aria-hidden
      />
      <Container className="relative">
        <div className="max-w-3xl">
          <div className="animate-drift-in" style={{ animationDelay: "0.05s" }}>
            <Eyebrow>{eyebrow}</Eyebrow>
          </div>
          <h1
            className="animate-drift-in text-h1 text-ink"
            style={{ animationDelay: "0.15s" }}
          >
            {title}
          </h1>
          {intro ? (
            <p
              className="animate-drift-in mt-5 max-w-2xl text-lg leading-relaxed text-muted"
              style={{ animationDelay: "0.3s" }}
            >
              {intro}
            </p>
          ) : null}
          {children ? (
            <div className="animate-drift-in mt-8" style={{ animationDelay: "0.45s" }}>
              {children}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
