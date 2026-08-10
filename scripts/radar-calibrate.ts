/**
 * Калибровочный прогон Радара из терминала.
 *
 * Делает настоящий discovery через YouTube API, считает базовые линии,
 * выбросы и score, и печатает распределение — то, по чему двигают пороги в
 * data/video-radar/scoring.v1.json.
 *
 * Транскрипты и AI-анализ выключены жёстко: калибруются пороги отбора, а они
 * считаются до этих стадий. Прогон не тратит ни токенов, ни времени на то,
 * что на результат не влияет.
 */

import {
  buildCalibrationReport,
  type CalibrationObservation,
  type Distribution,
} from "@/lib/video-radar/calibration";
import { radarConfig } from "@/lib/video-radar/config";
import { DisabledAnalysisProvider } from "@/lib/video-radar/analysis/analyze";
import { DisabledTranscriptProvider } from "@/lib/video-radar/providers/transcript";
import { FixtureVideoProvider, YouTubeProvider } from "@/lib/video-radar/providers/youtube";
import type { ProviderVideo, VideoProvider } from "@/lib/video-radar/providers/types";
import { classifyVideoType } from "@/lib/video-radar/videoType";
import { runRadar } from "@/lib/video-radar/run";
import { seedTopicsIfEmpty } from "@/lib/video-radar/seed";
import { InMemoryRadarStore } from "@/lib/video-radar/store/memory";

const bold = (s: string) => `[1m${s}[0m`;
const dim = (s: string) => `[2m${s}[0m`;
const green = (s: string) => `[32m${s}[0m`;
const yellow = (s: string) => `[33m${s}[0m`;
const red = (s: string) => `[31m${s}[0m`;

const USE_FIXTURE = process.argv.includes("--fixture");

/**
 * Синтетический набор для режима --fixture: два канала со стабильной историей
 * плюс по одному явному выбросу. Позволяет увидеть форму отчёта, не тратя
 * квоту — но это выдуманные данные, и пороги по ним калибровать нельзя.
 */
function fixtureProvider(): VideoProvider {
  const now = Date.now();
  const ago = (days: number) => new Date(now - days * 86_400_000).toISOString();

  const make = (
    channelId: string,
    channelName: string,
    id: string,
    title: string,
    views: number,
    days: number,
    duration: number,
  ): ProviderVideo => ({
    platform: "youtube",
    externalVideoId: id,
    channelId,
    channelName,
    title,
    description: "villa operations, property management, day to day operations workflow",
    sourceUrl: `https://www.youtube.com/watch?v=${id}`,
    thumbnailUrl: null,
    publishedAt: ago(days),
    durationSeconds: duration,
    videoType: classifyVideoType(duration),
    language: "en",
    views,
    likes: Math.round(views * 0.05),
    comments: Math.round(views * 0.006),
  });

  const videos: ProviderVideo[] = [];
  for (const [channelId, name, base] of [
    ["UCaaaaaaaaaaaaaaaaaaaaaa", "Ops Studio", 1_200],
    ["UCbbbbbbbbbbbbbbbbbbbbbb", "Villa Systems", 3_400],
  ] as const) {
    for (let index = 0; index < 20; index += 1) {
      videos.push(
        make(channelId, name, `${channelId}-h${index}`, "automation for small teams", base, 20 + index, 900),
      );
    }
    videos.push(
      make(channelId, name, `${channelId}-hit`, "villa operations audit in one week", base * 14, 10, 900),
    );
  }
  return new FixtureVideoProvider(videos, []);
}

/** Возвращает ключ или завершает процесс с понятным сообщением. */
function requireApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    console.error(red("\n✗ YOUTUBE_API_KEY не задан."));
    console.error("  Запустите настройку:  npm run radar:setup\n");
    process.exit(1);
  }
  return key;
}

/**
 * Русские формулировки по коду наблюдения. Сама библиотека остаётся английской,
 * потому что тот же отчёт отдаётся JSON-ом через API; код — это то, что
 * позволяет каждой поверхности говорить на своём языке, не дублируя логику.
 *
 * Тон сохранён: это описание факта, а не указание, какое значение поставить.
 */
function ru(note: CalibrationObservation): string {
  const d = note.data;
  switch (note.code) {
    case "empty":
      return "Оценённых видео нет — сначала нужен прогон.";
    case "gate_rejects_all":
      return (
        "Отбор не прошло ни одно видео. Прежде чем считать, что сигнала нет, " +
        "посмотрите гистограмму выше — она показывает, какое правило связывающее."
      );
    case "gate_too_permissive":
      return (
        `Отбор прошли ${d.passRatePercent}% оценённых видео. При такой мягкости гейт почти ничего ` +
        "не фильтрует — шортлист близок к сырому пулу."
      );
    case "binding_constraint":
      return (
        `Связывающее ограничение — «${d.rule}»: оно в ${d.count} отказах из ${d.scored}. ` +
        "Пока не сдвинется оно, правка остальных порогов почти ничего не изменит."
      );
    case "score_ceiling_above_p90":
      return (
        `90-й перцентиль score (${d.p90}) ниже minCandidateScore (${d.threshold}) — ` +
        "значит по score в принципе не может пройти больше 10% видео."
      );
    case "relevance_below_threshold":
      return (
        `Медиана релевантности (${d.median}) ниже minRelevance (${d.threshold}). ` +
        "Обычно это значит, что ключевые слова топиков не совпадают с тем, как эта ниша " +
        "реально называет видео, а не что видео нерелевантны."
      );
    case "baselines_not_accumulated":
      return (
        `У ${d.unmeasured} видео из ${d.scored} нет измеримого выброса — почти всегда потому, ` +
        "что по их каналу ещё не накоплено сопоставимых видео. Базовые линии растут с каждым " +
        "прогоном, поэтому калибровать пороги стоит после нескольких прогонов, а не после первого."
      );
    default:
      return note.text;
  }
}

function num(value: number | null, digits = 2): string {
  return typeof value === "number" ? value.toFixed(digits) : dim("—");
}

function printDistribution(label: string, dist: Distribution, digits = 2): void {
  if (dist.count === 0) {
    console.log(`  ${label.padEnd(18)} ${dim("нет данных")}`);
    return;
  }
  console.log(
    `  ${label.padEnd(18)} min ${num(dist.min, digits)}   p25 ${num(dist.p25, digits)}   ` +
      `${bold(`медиана ${num(dist.median, digits)}`)}   p75 ${num(dist.p75, digits)}   ` +
      `p90 ${num(dist.p90, digits)}   max ${num(dist.max, digits)}`,
  );
}

async function main(): Promise<void> {
  const provider = USE_FIXTURE ? fixtureProvider() : new YouTubeProvider(requireApiKey());
  const store = new InMemoryRadarStore();

  console.log(bold("\nКалибровочный прогон Video Radar"));
  console.log(dim("Хранилище: в памяти (одноразовое) · AI и транскрипты выключены"));
  if (USE_FIXTURE) console.log(yellow("Режим --fixture: выдуманные данные. Пороги по ним калибровать нельзя.\n"));
  else console.log("");

  const topics = await seedTopicsIfEmpty(store);
  const creators = await store.listCreators({ activeOnly: true });

  console.log(`Топиков активно: ${topics.filter((t) => t.active).length}`);
  console.log(`Каналов в watchlist: ${creators.length}`);

  if (creators.length === 0) {
    // Это не поломка, но результат первого прогона без watchlist предсказуемо
    // слабый, и лучше сказать это заранее, чем объяснять потом.
    console.log(
      yellow(
        "\n⚠ Watchlist пуст, поэтому сработает только поиск по топикам.\n" +
          "  Базовые линии считаются по каждому автору отдельно, а у случайно\n" +
          "  найденного автора истории в базе ещё нет — большинство видео честно\n" +
          "  получат «базовая линия недоступна». Это ожидаемо для первого прогона.",
      ),
    );
  }

  const estimatedUnits = topics.filter((t) => t.active).length * 3 * 100;
  console.log(dim(`\nОценка расхода квоты: ~${estimatedUnits.toLocaleString("ru-RU")} юнитов из 10 000/сутки`));
  if (!USE_FIXTURE) console.log(dim("Идёт запрос к YouTube — это займёт до минуты…\n"));

  const started = Date.now();
  const run = await runRadar({
    store,
    videoProvider: provider,
    transcriptProvider: new DisabledTranscriptProvider(),
    analysisProvider: new DisabledAnalysisProvider(),
  });
  const seconds = Math.round((Date.now() - started) / 1000);

  const statusColour = run.status === "completed" ? green : run.status === "partial" ? yellow : red;
  console.log(`${bold("Прогон:")} ${statusColour(run.status)} ${dim(`за ${seconds}с`)}`);
  console.log(
    `  найдено ${run.counters.videosDiscovered} · обновлено ${run.counters.videosUpdated} · ` +
      `оценено ${run.counters.videosScored} · в шортлисте ${run.counters.shortlisted}`,
  );

  if (run.failures.length > 0) {
    console.log(yellow(`\n⚠ Сбоев на отдельных элементах: ${run.failures.length} (прогон продолжился)`));
    const byCode = new Map<string, number>();
    for (const failure of run.failures) byCode.set(failure.code, (byCode.get(failure.code) ?? 0) + 1);
    for (const [code, count] of byCode) console.log(`  ${code}: ${count}`);
    const first = run.failures[0];
    console.log(dim(`  первый: [${first.stage}] ${first.message}`));
  }

  const scores = await store.listScores(run.id);
  const report = buildCalibrationReport(run.id, scores);

  console.log(bold("\n── Распределение ──"));
  printDistribution("Candidate score", report.candidateScore, 3);
  printDistribution("Relevance", report.relevance, 2);
  printDistribution("Outlier ratio", report.outlierRatio, 2);
  if (report.outlierRatio.unmeasured > 0) {
    console.log(
      dim(`  ${" ".repeat(18)} без измеримого выброса: ${report.outlierRatio.unmeasured} из ${report.scored}`),
    );
  }

  console.log(bold("\n── Базовые линии ──"));
  for (const [confidence, count] of Object.entries(report.baselineConfidence)) {
    console.log(`  ${confidence.padEnd(14)} ${count}`);
  }

  if (Object.keys(report.gateRejections).length > 0) {
    console.log(bold("\n── Что отсекает quality gate ──"));
    const total = report.scored;
    const sorted = Object.entries(report.gateRejections).sort((a, b) => b[1] - a[1]);
    for (const [category, count] of sorted) {
      const share = total > 0 ? Math.round((count / total) * 100) : 0;
      const bar = "█".repeat(Math.round(share / 4));
      console.log(`  ${category.padEnd(20)} ${String(count).padStart(4)}  ${dim(`${share}%`)} ${bar}`);
    }
  }

  console.log(bold("\n── Пороги сейчас ──"));
  console.log(`  minOutlierRatio    ${report.thresholds.minOutlierRatio}`);
  console.log(`  minRelevance       ${report.thresholds.minRelevance}`);
  console.log(`  minCandidateScore  ${report.thresholds.minCandidateScore}`);
  console.log(dim(`  версия скоринга    ${report.scoringVersion}`));

  console.log(bold(`\n── Прошло отбор: ${report.passed} из ${report.scored} ──`));

  if (report.observations.length > 0) {
    console.log(bold("\n── Наблюдения ──"));
    // Формулировки намеренно описательные: отчёт фиксирует факт, а решение о
    // новом значении порога остаётся за человеком.
    for (const note of report.observations) console.log(`  • ${ru(note)}`);
  }

  console.log(dim(`\nПороги правятся в data/video-radar/scoring.v1.json`));
  console.log(dim(`Хранилище было одноразовым — данные этого прогона не сохранены.\n`));

  // Машиночитаемая копия для передачи в чат: одна строка, без секретов.
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(report));
  }
}

main().catch((cause: unknown) => {
  console.error(red(`\n✗ Прогон упал: ${cause instanceof Error ? cause.message : String(cause)}`));
  process.exit(1);
});
