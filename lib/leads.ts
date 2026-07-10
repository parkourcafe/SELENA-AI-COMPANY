export const leadTypes = ["contact_brief", "ai_map_brief", "newsletter_signup"] as const;

export type LeadType = (typeof leadTypes)[number];

export type LeadFields = Record<string, string>;

export type LeadSubmission = {
  type: LeadType;
  fields: LeadFields;
  consent: true;
  sourcePath?: string;
};

type LeadResponse = {
  ok?: boolean;
  error?: string;
};

export const leadTypeLabels: Record<LeadType, string> = {
  contact_brief: "Бриф на AI-задачу",
  ai_map_brief: "AI-карта возможностей",
  newsletter_signup: "Подписка на разборы",
};

export function isLeadType(value: unknown): value is LeadType {
  return typeof value === "string" && leadTypes.includes(value as LeadType);
}

export class LeadSubmitError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number) {
    super(code);
    this.name = "LeadSubmitError";
    this.code = code;
    this.status = status;
  }
}

export function getLeadSubmitErrorMessage(
  error: unknown,
  locale: "ru" | "en" = "ru",
) {
  if (
    error instanceof LeadSubmitError &&
    error.code === "LEAD_DELIVERY_NOT_CONFIGURED"
  ) {
    if (locale === "en") {
      return "The form is not connected to a lead channel yet. You can send the same brief directly instead.";
    }

    return "Форма пока не подключена к каналу приёма заявок. Можно отправить этот же бриф напрямую.";
  }

  if (locale === "en") {
    return "The form could not be sent. Try again in a minute or send the brief directly.";
  }

  return "Не удалось отправить форму. Попробуйте ещё раз через минуту или отправьте бриф напрямую.";
}

export function formatLeadFallbackMessage(
  title: string,
  fields: Record<string, string>,
) {
  const lines = Object.entries(fields)
    .map(([label, value]) => [label, value.trim()] as const)
    .filter(([, value]) => Boolean(value))
    .map(([label, value]) => `${label}: ${value}`);

  return [title, ...lines].join("\n");
}

export async function submitLead(submission: LeadSubmission) {
  const response = await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...submission,
      sourcePath:
        submission.sourcePath ??
        (typeof window === "undefined" ? undefined : window.location.pathname),
    }),
  });

  const body = (await response.json().catch(() => null)) as LeadResponse | null;

  if (!response.ok || body?.ok !== true) {
    throw new LeadSubmitError(body?.error ?? "LEAD_SUBMIT_FAILED", response.status);
  }
}
