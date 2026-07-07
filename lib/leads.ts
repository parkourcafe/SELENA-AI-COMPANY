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

export function getLeadSubmitErrorMessage(error: unknown) {
  if (
    error instanceof LeadSubmitError &&
    error.code === "LEAD_DELIVERY_NOT_CONFIGURED"
  ) {
    return "Сейчас форма не подключена к каналу приёма заявок. Попробуйте позже или используйте прямой контакт, если он указан на странице.";
  }

  return "Не удалось отправить форму. Попробуйте ещё раз через минуту или используйте прямой контакт, если он указан на странице.";
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
