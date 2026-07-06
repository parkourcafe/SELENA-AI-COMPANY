# KORA — сайт

Премиальный русскоязычный сайт KORA: AI-внедрение, автоматизация, обучение,
контент-системы, AI-консьерж и базы знаний для предпринимателей, экспертов
и небольших команд.

Источники правды: `CLAUDE.md`, `docs/00-claude-code-premium-master-prompt.md`,
`docs/10-premium-cinematic-brief.md`, `docs/11-developer-tz-premium.md`.
Параллельная разработка: `docs/PARALLEL-PLAN.md`.

## Стек

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 (дизайн-токены в `app/globals.css`)
- Без тяжёлых зависимостей: анимации на CSS + IntersectionObserver

## Запуск

```bash
npm install
npm run dev        # http://localhost:3000
```

## Проверки

```bash
npm run lint
npm run typecheck
npm run build
```

## Структура

- `app/` — маршруты (App Router)
- `components/ui|layout|sections|forms` — компоненты
- `data/` — весь контент сайта (услуги, FAQ, аудитории, примеры, пакеты)
- `docs/` — брифы и ТЗ

## Правила контента

Только русский язык в UI. Никаких выдуманных кейсов, цифр, клиентов,
отзывов и цен — см. «Content integrity» в `CLAUDE.md`.
