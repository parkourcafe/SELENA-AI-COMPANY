import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import Reveal from "@/components/ui/Reveal";
import { faq } from "@/data/faq";

export default function FAQSection() {
  return (
    <section className="border-y border-line bg-surface py-20 sm:py-28">
      <Container className="max-w-4xl">
        <SectionHeader
          eyebrow="FAQ"
          title="Частые вопросы"
          lede="Если вашего вопроса нет — задайте его в брифе, отвечаю по существу."
        />
        <div className="mt-10">
          {faq.map((item, i) => (
            <Reveal key={item.question} delay={i * 40}>
              <details className="group border-b border-line py-1 open:pb-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-medium marker:hidden [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-copper-deep transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-2xl leading-relaxed text-muted">
                  {item.answer}
                </p>
              </details>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
