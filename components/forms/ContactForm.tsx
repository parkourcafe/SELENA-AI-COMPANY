"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * «Бриф на AI-задачу» — фронтенд-MVP по контракту (docs/12, TZ §11).
 * Валидация на клиенте, состояния ошибок, success-state, согласие на
 * обработку данных. Данные НИКУДА не отправляются:
 * TODO(backend): wire submission to email/Telegram/CRM.
 */

const TEAM_OPTIONS = [
  "Работаю один/одна",
  "Команда 2–5",
  "Команда 6–15",
  "Больше 15",
];

const FORMAT_OPTIONS = [
  "Пока не знаю — разобрать задачу",
  "AI-аудит",
  "Обучение",
  "Автоматизация",
  "Контент-система",
  "AI-консьерж",
  "Другое",
];

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink placeholder:text-muted transition-colors focus:border-copper";

const labelCls = "mb-1.5 block text-sm font-medium text-ink";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-sm font-medium text-copper-deep">
      {message}
    </p>
  );
}

export function ContactForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);

  // После успешной отправки переводим фокус на карточку подтверждения:
  // сама форма (вместе с кнопкой) размонтируется, и без этого фокус
  // «падает» на <body>, а скринридер молчит.
  useEffect(() => {
    if (submitted) successRef.current?.focus();
  }, [submitted]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const next: Record<string, string> = {};
    if (!String(data.get("name") ?? "").trim()) {
      next.name = "Напишите, как к вам обращаться.";
    }
    if (!String(data.get("contact") ?? "").trim()) {
      next.contact = "Оставьте Telegram, WhatsApp или email — иначе не получится ответить.";
    }
    if (!String(data.get("task") ?? "").trim()) {
      next.task = "Опишите задачу хотя бы в паре предложений — простыми словами.";
    }
    if (!data.get("consent")) {
      next.consent = "Без согласия на обработку данных бриф принять нельзя.";
    }

    setErrors(next);

    const firstInvalid = ["name", "contact", "task", "consent"].find((k) => next[k]);
    if (firstInvalid) {
      const el = form.elements.namedItem(firstInvalid);
      if (el instanceof HTMLElement) el.focus();
      return;
    }

    // TODO(backend): wire submission to email/Telegram/CRM.
    // Пока бэкенда нет — данные не покидают страницу (никаких сторонних
    // сервисов, см. контракт docs/12 «Hard don'ts»).
    setSubmitted(true);
  }

  return (
    <div>
      {/* Live-region смонтирован с первого рендера: условно вставленный
          элемент с role="status" скринридеры озвучивают ненадёжно. */}
      <p role="status" className="sr-only">
        {submitted
          ? "Бриф получен. Я разберу задачу и свяжусь с вами по указанному контакту."
          : ""}
      </p>

      {submitted ? (
        <div ref={successRef} tabIndex={-1} className="card-premium p-8 sm:p-10">
          <p className="font-serif text-h3 text-ink">Бриф получен</p>
          <p className="mt-4 leading-relaxed text-muted">
            Спасибо, что описали задачу. Дальше — короткий разбор: я посмотрю на
            процесс, подготовлю уточняющие вопросы или сразу предложу формат
            работы и свяжусь с вами по указанному контакту.
          </p>
          <p className="mt-4 text-sm text-muted">
            Каждый бриф разбирается вручную, без автоответов.
          </p>
        </div>
      ) : (
    <form onSubmit={handleSubmit} noValidate className="card-premium p-6 sm:p-8">
      <h2 className="text-h3 text-ink">Бриф на AI-задачу</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Не нужно технических терминов — опишите, как есть. Каждый бриф
        разбирается вручную.
      </p>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="brief-name" className={labelCls}>
            Имя <span aria-hidden="true" className="text-copper-deep">*</span>
          </label>
          <input
            id="brief-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "brief-name-error" : undefined}
            className={cn(inputCls, errors.name && "border-copper")}
          />
          <FieldError id="brief-name-error" message={errors.name} />
        </div>

        <div>
          <label htmlFor="brief-contact" className={labelCls}>
            Контакт: Telegram / WhatsApp / email{" "}
            <span aria-hidden="true" className="text-copper-deep">*</span>
          </label>
          <input
            id="brief-contact"
            name="contact"
            type="text"
            placeholder="@username или email"
            required
            aria-invalid={errors.contact ? true : undefined}
            aria-describedby={errors.contact ? "brief-contact-error" : undefined}
            className={cn(inputCls, errors.contact && "border-copper")}
          />
          <FieldError id="brief-contact-error" message={errors.contact} />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="brief-business" className={labelCls}>
          Чем занимаетесь?
        </label>
        <input
          id="brief-business"
          name="business"
          type="text"
          placeholder="Например: студия массажа, онлайн-курсы, консалтинг"
          className={inputCls}
        />
      </div>

      <div className="mt-5">
        <label htmlFor="brief-task" className={labelCls}>
          Какая задача сейчас важнее всего?{" "}
          <span aria-hidden="true" className="text-copper-deep">*</span>
        </label>
        <textarea
          id="brief-task"
          name="task"
          rows={4}
          required
          aria-invalid={errors.task ? true : undefined}
          aria-describedby={errors.task ? "brief-task-error" : undefined}
          className={cn(inputCls, "resize-y", errors.task && "border-copper")}
        />
        <FieldError id="brief-task-error" message={errors.task} />
      </div>

      <div className="mt-5">
        <label htmlFor="brief-broken" className={labelCls}>
          Что сейчас не работает?
        </label>
        <textarea
          id="brief-broken"
          name="broken"
          rows={3}
          className={cn(inputCls, "resize-y")}
        />
      </div>

      <div className="mt-5">
        <label htmlFor="brief-tools" className={labelCls}>
          Какие инструменты уже используете?
        </label>
        <input
          id="brief-tools"
          name="tools"
          type="text"
          placeholder="Например: Telegram, Notion, CRM, таблицы"
          className={inputCls}
        />
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="brief-team" className={labelCls}>
            Есть ли команда?
          </label>
          <select id="brief-team" name="team" defaultValue="" className={inputCls}>
            <option value="" disabled>
              Выберите вариант
            </option>
            {TEAM_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="brief-format" className={labelCls}>
            Какой формат интересен?
          </label>
          <select id="brief-format" name="format" defaultValue="" className={inputCls}>
            <option value="" disabled>
              Выберите вариант
            </option>
            {FORMAT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="brief-comment" className={labelCls}>
          Комментарий
        </label>
        <textarea
          id="brief-comment"
          name="comment"
          rows={3}
          className={cn(inputCls, "resize-y")}
        />
      </div>

      <div className="mt-6">
        <div className="flex items-start gap-3">
          <input
            id="brief-consent"
            name="consent"
            type="checkbox"
            required
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? "brief-consent-error" : undefined}
            className="mt-1 h-5 w-5 shrink-0 rounded border-line accent-copper"
          />
          <label htmlFor="brief-consent" className="text-sm leading-relaxed text-muted">
            Согласен(на) на обработку персональных данных для ответа на заявку —{" "}
            <Link
              href="/privacy"
              className="font-medium text-copper-deep underline decoration-copper/40 underline-offset-2 hover:decoration-copper"
            >
              как обрабатываются данные
            </Link>
            .
          </label>
        </div>
        <FieldError id="brief-consent-error" message={errors.consent} />
      </div>

      <button
        type="submit"
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-copper px-8 py-4 text-base font-medium tracking-tight text-surface shadow-[0_10px_24px_-12px_rgba(185,130,91,0.65)] transition-all duration-300 hover:-translate-y-px hover:bg-copper-deep sm:w-auto"
      >
        Отправить бриф
      </button>
    </form>
      )}
    </div>
  );
}
