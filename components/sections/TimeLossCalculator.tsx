"use client";

import { useMemo, useState } from "react";
import calculator from "@/data/calculator.json";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type InputKey =
  | "leadsMessagesHours"
  | "repetitiveAnswersHours"
  | "contentHours"
  | "crmDocsHours"
  | "teamTasksHours";

type CalculatorInput = {
  key: InputKey;
  label: string;
  min: number;
  max: number;
  default: number;
  recommendedService: string;
  recommendationReason: string;
};

const inputs = calculator.inputs as CalculatorInput[];

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function formatCandidate(low: number, high: number) {
  if (low === high) return `${low}`;
  return `${low}–${high}`;
}

export function TimeLossCalculator() {
  const [values, setValues] = useState<Record<InputKey, number>>(() =>
    inputs.reduce(
      (acc, item) => ({ ...acc, [item.key]: item.default }),
      {} as Record<InputKey, number>,
    ),
  );

  const result = useMemo(() => {
    const totalHours = inputs.reduce((sum, item) => sum + values[item.key], 0);
    const candidateLow = Math.round(totalHours * 0.25);
    const candidateHigh = Math.round(totalHours * 0.45);
    const top = inputs.reduce((winner, item) =>
      values[item.key] > values[winner.key] ? item : winner,
    );
    const range =
      calculator.rangeMessages.find(
        (item) => totalHours >= item.min && totalHours <= item.max,
      ) ?? calculator.rangeMessages[calculator.rangeMessages.length - 1];

    return { totalHours, candidateLow, candidateHigh, top, message: range.message };
  }, [values]);

  function updateValue(input: CalculatorInput, nextValue: number) {
    setValues((current) => ({
      ...current,
      [input.key]: clamp(Math.round(nextValue), input.min, input.max),
    }));
  }

  return (
    <section id="calculator" className="bg-surface py-20 sm:py-28">
      <Container>
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_0.82fr] lg:gap-14">
          <div>
            <Badge tone="copper">Предварительная диагностика</Badge>
            <h2 className="mt-4 text-h2 text-ink">{calculator.headline}</h2>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
              {calculator.subheadline}
            </p>

            <div className="mt-10 space-y-6">
              {inputs.map((input) => (
                <div key={input.key} className="rounded-2xl border border-line bg-ivory p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label htmlFor={`calc-${input.key}`} className="font-medium text-ink">
                      {input.label}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id={`calc-${input.key}`}
                        name={input.key}
                        type="number"
                        min={input.min}
                        max={input.max}
                        value={values[input.key]}
                        onChange={(event) => updateValue(input, Number(event.target.value))}
                        className="h-10 w-20 rounded-lg border border-line bg-surface px-3 text-right font-medium text-ink focus:border-copper"
                      />
                      <span className="text-sm text-muted">ч/нед.</span>
                    </div>
                  </div>
                  <input
                    aria-label={`${input.label}, часов в неделю`}
                    type="range"
                    min={input.min}
                    max={input.max}
                    value={values[input.key]}
                    onChange={(event) => updateValue(input, Number(event.target.value))}
                    className="mt-4 w-full accent-copper"
                  />
                </div>
              ))}
            </div>
          </div>

          <aside className="card-premium sticky top-28 p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-copper-deep">
              Результат
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-line bg-ivory p-5">
                <p className="text-sm text-muted">Ручная рутина в неделю</p>
                <p className="mt-2 font-serif text-4xl font-semibold text-ink">
                  {result.totalHours} ч
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-ivory p-5">
                <p className="text-sm text-muted">Стоит проверить на AI-сценарии</p>
                <p className="mt-2 font-serif text-4xl font-semibold text-ink">
                  {formatCandidate(result.candidateLow, result.candidateHigh)} ч
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-line pt-6">
              <Badge tone="sage">Кандидат на первый разбор</Badge>
              <h3 className="mt-3 text-h3 text-ink">{result.top.recommendedService}</h3>
              <p className="mt-3 leading-relaxed text-muted">
                {result.top.recommendationReason}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-ink/75">{result.message}</p>
            </div>

            <p className="mt-6 rounded-xl border border-copper/25 bg-copper/10 p-4 text-sm leading-relaxed text-muted">
              {calculator.disclaimer}
            </p>
            <Button href="/free-ai-map" size="lg" className="mt-6 w-full">
              {calculator.cta.primary}
            </Button>
          </aside>
        </div>
      </Container>
    </section>
  );
}
