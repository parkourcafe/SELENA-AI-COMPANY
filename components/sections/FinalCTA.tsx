import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import Button from "@/components/ui/Button";
import { cta } from "@/data/site";

export default function FinalCTA() {
  return (
    <section className="bg-charcoal bg-grain py-20 sm:py-28">
      <Container className="max-w-4xl text-center">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-surface sm:text-4xl">
            Разберём, где AI может помочь{" "}
            <em className="font-serif italic text-copper">вашему</em> бизнесу
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-surface/70">
            Опишите задачу простыми словами. Не нужно заранее знать, какой
            инструмент вам нужен — сначала разберём процесс.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/contact" variant="onDark">
              {cta.brief}
            </Button>
            <Button
              href="/services"
              className="border border-surface/25 bg-transparent text-surface hover:bg-surface/10"
            >
              {cta.secondary}
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
