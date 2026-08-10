#!/usr/bin/env node
/**
 * Добавление каналов в watchlist по ссылке или @хэндлу.
 *
 * Смысл: строке watchlist нужен настоящий YouTube channel id вида UC…, а он
 * нигде не показан в интерфейсе YouTube. Требовать его от человека — значит
 * требовать лезть в исходный код страницы. Скрипт принимает то, что реально
 * можно скопировать из адресной строки, и превращает это в id сам.
 *
 * Принимает в любом виде и в любом сочетании:
 *   @handle
 *   https://www.youtube.com/@handle
 *   https://www.youtube.com/channel/UC…
 *   UC…
 *
 * Пишет в data/video-radar/creators.seed.json, обновляя уже существующие
 * строки и не трогая ничего больше. Никаких выдуманных каналов: если YouTube
 * канал не подтвердил, строка не появляется.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const SEED_PATH = join(REPO, "data/video-radar/creators.seed.json");
const API = "https://www.googleapis.com/youtube/v3/channels";

const bold = (s) => `[1m${s}[0m`;
const dim = (s) => `[2m${s}[0m`;
const green = (s) => `[32m${s}[0m`;
const yellow = (s) => `[33m${s}[0m`;
const red = (s) => `[31m${s}[0m`;

/** Из ссылки/хэндла/id достаём то, по чему YouTube умеет искать. */
function parseTarget(raw) {
  const value = raw.trim().replace(/\/+$/, "");
  if (!value) return null;

  const channelUrl = value.match(/youtube\.com\/channel\/(UC[\w-]{20,})/i);
  if (channelUrl) return { kind: "id", value: channelUrl[1] };

  const handleUrl = value.match(/youtube\.com\/@([\w.-]+)/i);
  if (handleUrl) return { kind: "handle", value: handleUrl[1] };

  if (/^UC[\w-]{20,}$/.test(value)) return { kind: "id", value };
  if (value.startsWith("@")) return { kind: "handle", value: value.slice(1) };

  // Голое слово трактуем как хэндл: это самый вероятный случай, и ошибка
  // здесь безобидна — YouTube просто ничего не вернёт.
  return { kind: "handle", value };
}

async function resolve(target, apiKey) {
  const url = new URL(API);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("part", "snippet,statistics");
  if (target.kind === "id") url.searchParams.set("id", target.value);
  else url.searchParams.set("forHandle", target.value);

  const response = await fetch(url, { headers: { accept: "application/json" } });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const reason = body?.error?.errors?.[0]?.reason ?? "";
    // Сообщение YouTube может содержать сам ключ — наружу отдаём только причину.
    throw new Error(reason || `YouTube ответил ${response.status}`);
  }

  const item = body.items?.[0];
  if (!item?.id) return null;

  return {
    externalChannelId: item.id,
    channelName: item.snippet?.title ?? item.id,
    channelUrl: item.snippet?.customUrl
      ? `https://www.youtube.com/${item.snippet.customUrl}`
      : `https://www.youtube.com/channel/${item.id}`,
    subscribers: item.statistics?.hiddenSubscriberCount
      ? null
      : Number(item.statistics?.subscriberCount ?? Number.NaN),
  };
}

async function main() {
  const targets = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));

  if (targets.length === 0) {
    console.log(bold("\nДобавление каналов в watchlist Video Radar\n"));
    console.log("Перечислите каналы через пробел — ссылками или хэндлами:\n");
    console.log(dim("  npm run radar:add-creators -- @channelone @channeltwo"));
    console.log(dim("  npm run radar:add-creators -- https://www.youtube.com/@channelone\n"));
    console.log("Скрипт сам найдёт channel id, проверит, что канал существует,");
    console.log("и запишет его в data/video-radar/creators.seed.json.\n");
    process.exit(1);
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error(red("\n✗ YOUTUBE_API_KEY не задан."));
    console.error("  Запустите настройку:  npm run radar:setup\n");
    process.exit(1);
  }

  const seed = JSON.parse(readFileSync(SEED_PATH, "utf8"));
  const existing = Array.isArray(seed.creators) ? seed.creators : [];
  const byId = new Map(existing.map((creator) => [creator.externalChannelId, creator]));

  console.log(bold(`\nПроверяю ${targets.length} канал(ов) через YouTube…\n`));

  let added = 0;
  let updated = 0;
  let failed = 0;

  for (const raw of targets) {
    const target = parseTarget(raw);
    if (!target) continue;

    let channel;
    try {
      channel = await resolve(target, apiKey);
    } catch (cause) {
      console.log(`  ${red("✗")} ${raw} ${dim(`— ${cause.message}`)}`);
      failed += 1;
      continue;
    }

    if (!channel) {
      console.log(`  ${yellow("?")} ${raw} ${dim("— канал не найден, пропускаю")}`);
      failed += 1;
      continue;
    }

    const previous = byId.get(channel.externalChannelId);
    byId.set(channel.externalChannelId, {
      platform: "youtube",
      externalChannelId: channel.externalChannelId,
      channelName: channel.channelName,
      channelUrl: channel.channelUrl,
      // Приоритет ставится вручную в файле. 3 — нейтральная середина, а не
      // оценка канала, которую скрипт выдумал бы за вас.
      priority: previous?.priority ?? 3,
      tags: previous?.tags ?? [],
      languages: previous?.languages ?? [],
      targetProjects: previous?.targetProjects ?? [],
    });

    const subs = Number.isFinite(channel.subscribers)
      ? `${channel.subscribers.toLocaleString("ru-RU")} подписчиков`
      : "подписчики скрыты";
    console.log(
      `  ${green("✓")} ${channel.channelName} ${dim(`— ${subs} · ${channel.externalChannelId}`)}`,
    );
    if (previous) updated += 1;
    else added += 1;
  }

  seed.creators = [...byId.values()];
  writeFileSync(SEED_PATH, `${JSON.stringify(seed, null, 2)}\n`, "utf8");

  console.log(bold(`\nДобавлено: ${added} · обновлено: ${updated}${failed ? ` · не найдено: ${failed}` : ""}`));
  console.log(dim(`Записано в data/video-radar/creators.seed.json — всего каналов: ${seed.creators.length}`));

  if (added + updated > 0) {
    console.log("\nЧто дальше:");
    console.log(`  ${dim("1.")} При желании проставьте priority 1–5 и targetProjects в этом файле.`);
    console.log(`  ${dim("2.")} Запустите прогон:  ${bold("npm run radar:calibrate")}`);
    console.log(
      dim(
        "\nКанал в watchlist стоит ~3 юнита квоты против 100 за поисковый запрос,\n" +
          "и по нему всегда есть полная история — то есть настоящая базовая линия.\n",
      ),
    );
  } else {
    console.log("");
  }
}

main().catch((cause) => {
  console.error(red(`\n✗ ${cause instanceof Error ? cause.message : String(cause)}\n`));
  process.exit(1);
});
