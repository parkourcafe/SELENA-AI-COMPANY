import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { isLeadType, leadTypeLabels, type LeadFields, type LeadType } from "@/lib/leads";
import { isValidIdempotencyKey } from "@/lib/diagnostics/validators";
import { checkRateLimit, clientIpFrom } from "@/lib/visibility/security/rate-limit";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 24_000;
const MAX_FIELD_LENGTH = 1_500;
const MAX_FIELDS = 30;
const MAX_TELEGRAM_MESSAGE_LENGTH = 3_900;
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

const requiredFields: Record<LeadType, string[]> = {
  contact_brief: ["name", "contact", "task"],
  ai_map_brief: ["name", "contact", "business", "timeLoss", "priority"],
  newsletter_signup: ["contact"],
  // The free check runs on the page, so the brief is only what the check
  // itself needs plus a way to reach the person who asked for it.
  visibility_check: ["contact", "website", "primaryAction"],
};

const fieldLabels: Record<string, string> = {
  name: "Имя",
  contact: "Контакт",
  business: "Бизнес",
  task: "Задача",
  broken: "Что не работает",
  tools: "Инструменты",
  team: "Команда",
  format: "Формат",
  comment: "Комментарий",
  timeLoss: "Где уходит время",
  priority: "Приоритет",
  website: "Сайт",
  brandName: "Бренд",
  market: "Рынок",
  language: "Язык",
  businessModel: "Модель бизнеса",
  category: "Категория",
  primaryAction: "Основное действие",
  competitor: "Конкурент",
  localBusinessMode: "Local Business Mode",
  resultSummary: "Результат проверки",
};

type LeadRecord = {
  type: LeadType;
  fields: LeadFields;
  consent: true;
  sourcePath: string | null;
  receivedAt: string;
};

type DeliveryResult = {
  name: string;
  promise: Promise<void>;
};

type IdempotencyRecord = {
  fingerprint: string;
  status: number;
  body: { ok: boolean; error?: string };
  expiresAt: number;
};

const idempotencyRecords = new Map<string, IdempotencyRecord>();

function cleanEnv(value: string | undefined) {
  const next = value?.trim();
  return next ? next : null;
}

function sanitizeText(value: unknown, maxLength = MAX_FIELD_LENGTH) {
  if (typeof value !== "string") return "";
  return value.replace(/\0/g, "").trim().slice(0, maxLength);
}

function sanitizePath(value: unknown) {
  const path = sanitizeText(value, 240);
  return path.startsWith("/") ? path : null;
}

function normalizeFields(value: unknown): LeadFields {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.entries(value as Record<string, unknown>)
    .slice(0, MAX_FIELDS)
    .reduce<LeadFields>((acc, [key, raw]) => {
      const safeKey = key.replace(/[^\w.-]/g, "").slice(0, 48);
      const safeValue = sanitizeText(raw);
      if (safeKey && safeValue) acc[safeKey] = safeValue;
      return acc;
    }, {});
}

function normalizeLead(payload: unknown): { lead: LeadRecord } | { error: string; status: number } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "INVALID_JSON", status: 400 };
  }

  const record = payload as Record<string, unknown>;
  if (!isLeadType(record.type)) {
    return { error: "INVALID_LEAD_TYPE", status: 400 };
  }

  if (record.consent !== true) {
    return { error: "CONSENT_REQUIRED", status: 400 };
  }

  if (!isValidIdempotencyKey(record.idempotencyKey)) {
    return { error: "IDEMPOTENCY_KEY_REQUIRED", status: 400 };
  }

  if (sanitizeText(record.honeypot, 120)) {
    return { error: "SPAM_DETECTED", status: 400 };
  }

  if (!record.fields || typeof record.fields !== "object" || Array.isArray(record.fields)) {
    return { error: "FIELDS_REQUIRED", status: 400 };
  }

  const rawFields = Object.entries(record.fields as Record<string, unknown>);
  if (rawFields.length > MAX_FIELDS) {
    return { error: "TOO_MANY_FIELDS", status: 400 };
  }

  for (const [key, value] of rawFields) {
    if (!/^[-\w.]{1,48}$/.test(key)) {
      return { error: "FIELD_INVALID", status: 400 };
    }
    if (typeof value !== "string" || value.length > MAX_FIELD_LENGTH) {
      return { error: "FIELD_INVALID", status: 400 };
    }
    if (key === "name" && value.trim().length < 2) {
      return { error: "FIELD_INVALID", status: 400 };
    }
    if (["contact", "task", "challenge", "timeLoss", "priority"].includes(key) && value.trim().length < 2) {
      return { error: "FIELD_INVALID", status: 400 };
    }
  }

  const fields = normalizeFields(record.fields);
  const missing = requiredFields[record.type].filter((field) => !fields[field]);
  if (missing.length > 0) {
    return { error: "MISSING_REQUIRED_FIELDS", status: 400 };
  }

  return {
    lead: {
      type: record.type,
      fields,
      consent: true,
      sourcePath: sanitizePath(record.sourcePath),
      receivedAt: new Date().toISOString(),
    },
  };
}

function fingerprintLead(payload: Record<string, unknown>) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        type: payload.type,
        fields: payload.fields,
        consent: payload.consent,
        sourcePath: payload.sourcePath,
        honeypot: payload.honeypot,
      }),
    )
    .digest("hex");
}

function evictIdempotencyRecords(now = Date.now()) {
  for (const [key, record] of idempotencyRecords) {
    if (record.expiresAt <= now) idempotencyRecords.delete(key);
  }
}

function formatLeadForTelegram(lead: LeadRecord) {
  const lines = [
    `🔔 Новая заявка: ${leadTypeLabels[lead.type]}`,
    `Источник: ${lead.sourcePath ?? "site"}`,
    `Время: ${lead.receivedAt}`,
    "",
  ];

  for (const [key, value] of Object.entries(lead.fields)) {
    const label = fieldLabels[key] ?? key;
    // Multi-line values (the traffic-light check summary) read as their own
    // block; inlining them after the label produced an unreadable wall.
    if (String(value).includes("\n")) {
      lines.push("", `${label}:`, String(value));
    } else {
      lines.push(`${label}: ${value}`);
    }
  }

  return lines.join("\n").slice(0, MAX_TELEGRAM_MESSAGE_LENGTH);
}

async function sendTelegram(lead: LeadRecord, token: string, chatId: string) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: formatLeadForTelegram(lead),
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram delivery failed with status ${response.status}`);
  }
}

async function sendWebhook(lead: LeadRecord, webhookUrl: string) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...lead,
      leadLabel: leadTypeLabels[lead.type],
    }),
  });

  if (!response.ok) {
    throw new Error(`Webhook delivery failed with status ${response.status}`);
  }
}

function getDeliveries(lead: LeadRecord): DeliveryResult[] {
  const telegramToken = cleanEnv(process.env.LEADS_TELEGRAM_BOT_TOKEN);
  const telegramChatId = cleanEnv(process.env.LEADS_TELEGRAM_CHAT_ID);
  const webhookUrl = cleanEnv(process.env.LEADS_WEBHOOK_URL);
  const deliveries: DeliveryResult[] = [];

  if (telegramToken && telegramChatId) {
    deliveries.push({
      name: "telegram",
      promise: sendTelegram(lead, telegramToken, telegramChatId),
    });
  }

  if (webhookUrl) {
    deliveries.push({
      name: "webhook",
      promise: sendWebhook(lead, webhookUrl),
    });
  }

  return deliveries;
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`lead:${clientIpFrom(request.headers)}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "RATE_LIMITED" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  const normalized = normalizeLead(payload);
  if ("error" in normalized) {
    return NextResponse.json(
      { ok: false, error: normalized.error },
      { status: normalized.status },
    );
  }

  const record = payload as Record<string, unknown>;
  evictIdempotencyRecords();
  const idempotencyKey = String(record.idempotencyKey);
  const fingerprint = fingerprintLead(record);
  const previous = idempotencyRecords.get(idempotencyKey);
  if (previous) {
    if (previous.fingerprint !== fingerprint) {
      return NextResponse.json({ ok: false, error: "IDEMPOTENCY_KEY_REUSED" }, { status: 409 });
    }
    return NextResponse.json(previous.body, { status: previous.status });
  }

  const deliveries = getDeliveries(normalized.lead);
  if (deliveries.length === 0) {
    return NextResponse.json(
      { ok: false, error: "LEAD_DELIVERY_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const results = await Promise.allSettled(deliveries.map((delivery) => delivery.promise));
  const failed = results
    .map((result, index) => ({ result, name: deliveries[index]?.name ?? "unknown" }))
    .filter(({ result }) => result.status === "rejected");

  if (failed.length === deliveries.length) {
    console.error(
      "Lead delivery failed",
      failed.map(({ name }) => name),
    );
    return NextResponse.json({ ok: false, error: "LEAD_DELIVERY_FAILED" }, { status: 502 });
  }

  if (failed.length > 0) {
    console.error(
      "Lead delivery partially failed",
      failed.map(({ name }) => name),
    );
  }

  const responseBody = { ok: true } as const;
  idempotencyRecords.set(idempotencyKey, {
    fingerprint,
    status: 200,
    body: responseBody,
    expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
  });
  return NextResponse.json(responseBody);
}
