import { NextResponse } from "next/server";
import { isLeadType, leadTypeLabels, type LeadFields, type LeadType } from "@/lib/leads";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 24_000;
const MAX_FIELD_LENGTH = 1_500;
const MAX_FIELDS = 30;
const MAX_TELEGRAM_MESSAGE_LENGTH = 3_900;

const requiredFields: Record<LeadType, string[]> = {
  contact_brief: ["name", "contact", "task"],
  ai_map_brief: ["name", "contact", "business", "timeLoss", "priority"],
  newsletter_signup: ["contact"],
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

function formatLeadForTelegram(lead: LeadRecord) {
  const lines = [
    `Новая заявка: ${leadTypeLabels[lead.type]}`,
    `Источник: ${lead.sourcePath ?? "site"}`,
    `Время: ${lead.receivedAt}`,
    "",
  ];

  for (const [key, value] of Object.entries(lead.fields)) {
    lines.push(`${fieldLabels[key] ?? key}: ${value}`);
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

  return NextResponse.json({ ok: true });
}
