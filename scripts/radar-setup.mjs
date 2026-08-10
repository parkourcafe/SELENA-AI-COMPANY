#!/usr/bin/env node
/**
 * Одна команда, которая делает всю настройку Радара.
 *
 * Проверяет, что запущена из репозитория; чинит .env.local, случайно созданный
 * в домашней папке; спрашивает ключ скрытым вводом; сам генерирует токен
 * оператора; проверяет ключ через YouTube API; записывает .env.local; и сразу
 * запускает калибровочный прогон.
 *
 * Секреты не печатаются никогда — ни в подсказках, ни в ошибках, ни в истории
 * шелла (ввод идёт в stdin, а не аргументом команды).
 */

import { createInterface } from "node:readline";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const REPO = process.cwd();
const ENV_PATH = join(REPO, ".env.local");
const HOME_ENV = join(homedir(), ".env.local");

/** Переменные Радара — только их скрипт трогает в чужих файлах. */
const RADAR_KEYS = [
  "VIDEO_RADAR_ENABLED",
  "VIDEO_RADAR_OPERATOR_TOKEN",
  "VIDEO_RADAR_DISCOVERY_ENABLED",
  "VIDEO_RADAR_TRANSCRIPTS_ENABLED",
  "VIDEO_RADAR_ANALYSIS_ENABLED",
  "YOUTUBE_API_KEY",
];

const bold = (s) => `[1m${s}[0m`;
const dim = (s) => `[2m${s}[0m`;
const green = (s) => `[32m${s}[0m`;
const red = (s) => `[31m${s}[0m`;
const yellow = (s) => `[33m${s}[0m`;

function line(text = "") {
  console.log(text);
}

function bail(message, hints = []) {
  line(`\n${red("✗")} ${message}`);
  for (const hint of hints) line(`  ${dim("→")} ${hint}`);
  process.exit(1);
}

function ask(question, { hidden = false } = {}) {
  return new Promise((resolvePrompt) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let muted = false;

    // Скрытый ввод: подсказку печатаем сами, дальше глушим эхо, чтобы ключ не
    // появился на экране и не попал в скриншот или запись сессии.
    rl._writeToOutput = function (chunk) {
      if (!muted) rl.output.write(chunk);
    };

    process.stdout.write(question);
    if (hidden) muted = true;

    rl.question("", (answer) => {
      if (hidden) process.stdout.write("\n");
      rl.close();
      resolvePrompt(answer.trim());
    });
  });
}

async function confirm(question) {
  const answer = await ask(`${question} ${dim("[y/N]")} `);
  return /^(y|yes|д|да)$/i.test(answer);
}

/** Разбирает .env в массив строк с пометкой, что это: переменная, комментарий или мусор. */
function parseEnv(text) {
  return text.split("\n").map((raw) => {
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed.startsWith("#")) return { kind: "keep", raw };
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
    if (match) return { kind: "var", raw, name: match[1], value: match[2] };
    return { kind: "junk", raw };
  });
}

// ── 1. Мы точно в репозитории? ────────────────────────────────────────────────

if (!existsSync(join(REPO, "package.json"))) {
  bail(`Здесь нет package.json: ${REPO}`, [
    "Перейдите в папку репозитория и запустите снова:",
    "cd <папка-SELENA-AI-COMPANY> && npm run radar:setup",
  ]);
}

const pkg = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8"));
if (pkg.name !== "selena-systems-website") {
  bail(`Это другой проект: ${pkg.name}`, ["Нужна папка репозитория SELENA-AI-COMPANY."]);
}

line(`\n${bold("Настройка Video Radar")}`);
line(dim(`Репозиторий: ${REPO}\n`));

// ── 2. Прибираем .env.local, случайно созданный в домашней папке ──────────────

if (existsSync(HOME_ENV) && resolve(HOME_ENV) !== resolve(ENV_PATH)) {
  const entries = parseEnv(readFileSync(HOME_ENV, "utf8"));
  const radarVars = entries.filter((e) => e.kind === "var" && RADAR_KEYS.includes(e.name));
  const junk = entries.filter((e) => e.kind === "junk");
  const foreign = entries.filter((e) => e.kind === "var" && !RADAR_KEYS.includes(e.name));

  if (radarVars.length > 0 || junk.length > 0) {
    line(yellow(`⚠ В ${HOME_ENV} лежат переменные Радара — приложение их оттуда не читает.`));
    if (radarVars.length > 0) {
      line(`  Переменные Радара: ${[...new Set(radarVars.map((e) => e.name))].join(", ")}`);
    }
    if (junk.length > 0) line(`  Строки-мусор (обрывки команд): ${junk.length}`);
    if (foreign.length > 0) {
      // Это чужие секреты — например SUPABASE_SERVICE_ROLE_KEY. Не трогаем и
      // говорим об этом прямо, чтобы не было сомнений.
      line(green(`  Не будет тронуто: ${[...new Set(foreign.map((e) => e.name))].join(", ")}`));
    }

    if (await confirm("\nУбрать оттуда только строки Радара и мусор? (будет сделана резервная копия)")) {
      copyFileSync(HOME_ENV, `${HOME_ENV}.bak`);
      const kept = entries.filter(
        (e) => !(e.kind === "junk" || (e.kind === "var" && RADAR_KEYS.includes(e.name))),
      );
      writeFileSync(HOME_ENV, `${kept.map((e) => e.raw).join("\n").trimEnd()}\n`, { mode: 0o600 });
      line(green(`✓ Почищено. Копия: ${HOME_ENV}.bak`));
      line(yellow("  Ключ побывал в этом файле — перевыпустите его в Google Cloud Console."));
    }
    line();
  }
}

// ── 3. Что уже есть в .env.local репозитория ─────────────────────────────────

const existing = new Map();
if (existsSync(ENV_PATH)) {
  for (const entry of parseEnv(readFileSync(ENV_PATH, "utf8"))) {
    if (entry.kind === "var") existing.set(entry.name, entry.value);
  }
  line(dim(`Найден .env.local: ${existing.size} переменных\n`));
}

// ── 4. Ключ YouTube ──────────────────────────────────────────────────────────

let youtubeKey = process.env.YOUTUBE_API_KEY || existing.get("YOUTUBE_API_KEY") || "";

if (youtubeKey) {
  line(`YOUTUBE_API_KEY уже задан ${dim(`(${youtubeKey.length} символов)`)}`);
  if (await confirm("Заменить его?")) youtubeKey = "";
}

if (!youtubeKey) {
  line(dim("\nВставьте ключ — он не отобразится на экране и не попадёт в историю команд."));
  youtubeKey = await ask("YOUTUBE_API_KEY: ", { hidden: true });
  if (!youtubeKey) bail("Ключ не введён.");
}

// ── 5. Токен оператора генерируем сами ───────────────────────────────────────

let operatorToken = existing.get("VIDEO_RADAR_OPERATOR_TOKEN") || "";
if (!operatorToken) {
  operatorToken = randomBytes(32).toString("hex");
  line(green("✓ Токен оператора сгенерирован автоматически."));
}

// ── 6. Проверяем ключ до того, как что-то включать ───────────────────────────

const safe = (text) => String(text ?? "").split(youtubeKey).join("***");

async function youtube(path, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  url.searchParams.set("key", youtubeKey);

  const response = await fetch(url, { headers: { accept: "application/json" } }).catch((cause) => {
    bail(`Не удалось связаться с YouTube API: ${safe(cause?.message)}`);
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reason = body?.error?.errors?.[0]?.reason ?? "";
    const message = safe(body?.error?.message ?? `HTTP ${response.status}`);

    const hints = {
      API_KEY_INVALID: ["Ключ неверный или удалён. Google Cloud Console → Credentials."],
      SERVICE_DISABLED: [
        "YouTube Data API v3 не включён в проекте Google Cloud.",
        "Console → APIs & Services → Library → YouTube Data API v3 → Enable.",
      ],
      accessNotConfigured: [
        "YouTube Data API v3 не включён в проекте Google Cloud.",
        "Console → APIs & Services → Library → YouTube Data API v3 → Enable.",
      ],
      API_KEY_HTTP_REFERRER_BLOCKED: [
        "Ключ ограничен по HTTP referrer («браузерный ключ») — с сервера он не работает.",
        "Console → Credentials → ключ → Application restrictions → None или IP addresses.",
        "Это самая частая причина: ключ выглядит рабочим, но серверные вызовы отклоняются.",
      ],
      API_KEY_SERVICE_BLOCKED: [
        "Ключ ограничен списком API, в котором нет YouTube Data API v3.",
        "Console → Credentials → ключ → API restrictions → добавьте YouTube Data API v3.",
      ],
      quotaExceeded: ["Дневная квота (10 000 юнитов) исчерпана. Сбрасывается в полночь по Тихоокеанскому времени."],
    }[reason] ?? (reason ? [`Код причины: ${reason}`] : []);

    bail(`${path} → HTTP ${response.status}: ${message}`, hints);
  }
  return body;
}

line("\nПроверяю ключ…");
await youtube("i18nLanguages", { part: "snippet" });
line(green("  ✓ ключ валиден, API включён") + dim("  (1 юнит)"));

const search = await youtube("search", { part: "snippet", type: "video", q: "ai automation", maxResults: "1" });
line(green(`  ✓ поиск работает, найдено ${search.items?.length ?? 0}`) + dim("  (100 юнитов)"));

// ── 7. Пишем .env.local ──────────────────────────────────────────────────────

const values = {
  ...Object.fromEntries(existing),
  VIDEO_RADAR_ENABLED: "true",
  VIDEO_RADAR_OPERATOR_TOKEN: operatorToken,
  YOUTUBE_API_KEY: youtubeKey,
  // Включается только сейчас — после успешной проверки, не раньше.
  VIDEO_RADAR_DISCOVERY_ENABLED: "true",
};

const content =
  "# Video Radar — локальные секреты. Файл в .gitignore, в коммит не попадёт.\n" +
  Object.entries(values)
    .map(([name, value]) => `${name}=${value}`)
    .join("\n") +
  "\n";

// 0600 — читать может только владелец.
writeFileSync(ENV_PATH, content, { mode: 0o600 });
line(green(`\n✓ Записан ${ENV_PATH}`) + dim("  (права 0600, только для вас)"));
line(dim(`  Переменных: ${Object.keys(values).length}. Discovery включён.`));

// ── 8. Сразу калибровочный прогон ────────────────────────────────────────────

line(`\n${bold("Запускаю калибровочный прогон")} ${dim("(без AI — только метаданные)")}\n`);

const child = spawn(
  process.execPath,
  ["--env-file=.env.local", "--import", "tsx", "scripts/radar-calibrate.ts"],
  { cwd: REPO, stdio: "inherit" },
);

child.on("exit", (code) => process.exit(code ?? 0));
