# План параллельной разработки (3 сессии Claude Code)

> Сайт KORA собирают три параллельные сессии. Чтобы не было конфликтов,
> каждая сессия работает СТРОГО в своих файлах. Общий фундамент уже в ветке
> `claude/new-session-ygg1wg` — все сессии начинают с него:
>
> ```bash
> git fetch origin claude/new-session-ygg1wg
> git checkout claude/new-session-ygg1wg   # или rebase своей ветки на неё
> ```
>
> Перед каждым push: `git pull --rebase origin claude/new-session-ygg1wg`.

## Фундамент (готов, не трогать без причины)

- Конфиги: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`
- Дизайн-токены и анимации: `app/globals.css` (палитра из `docs/11` §8, reduced-motion)
- Данные: `data/site.ts`, `data/services.ts`, `data/faq.ts`, `data/audiences.ts`, `data/examples.ts`, `data/process.ts`, `data/packages.ts`
- UI: `components/ui/` (Container, Button, Badge, Card, SectionHeader, Reveal)
- Каркас: `components/layout/Header.tsx`, `components/layout/Footer.tsx`

## Сессия 1 — Главная страница (ЭТА сессия)

Владеет файлами:

- `app/layout.tsx`, `app/page.tsx`
- `components/sections/*` (все секции главной)
- `README.md`, фундамент и его починка

## Сессия 2 — Страницы услуг

Владеет файлами:

- `app/services/page.tsx` — каталог услуг (все 8 модулей из `data/services.ts`)
- `app/ai-training/page.tsx` — продающая страница обучения
- `app/ai-automation/page.tsx` — продающая страница автоматизации
- `app/ai-content/page.tsx` — контент-система + AI-упаковка

Правила: использовать готовые `components/ui/*` и данные из `data/`;
metadata (title/description) на каждой странице; один H1; копирайт по
`docs/00`, `docs/10`, `docs/11` и `CLAUDE.md`; никаких выдуманных кейсов,
цифр и цен («формат оценивается после брифа»). Новые секции, нужные только
страницам услуг, класть в `components/sections/service-pages/`.

## Сессия 3 — Контакт, форма, about, юр. страницы, SEO

Владеет файлами:

- `components/forms/ContactForm.tsx` — «Бриф на AI-задачу» (поля из `docs/11` §11,
  client-side валидация, success state, consent checkbox, TODO для интеграции)
- `app/contact/page.tsx`
- `app/about/page.tsx` — позиционирование и принципы, БЕЗ выдуманной биографии/регалий
- `app/privacy/page.tsx`, `app/terms/page.tsx` — простые честные страницы
- `app/sitemap.ts`, `app/robots.ts`, `app/icon.svg` (простой знак KORA)

Правила: те же. Форма никуда не отправляет данные наружу — только фронтенд-MVP.

## Общие запреты (для всех сессий)

- Не редактировать чужие файлы. Если нужен новый общий компонент/данные —
  создать в своей зоне и оставить заметку здесь в секции «Хэндофф».
- Не выдумывать факты, кейсы, отзывы, цифры, клиентов, цены.
- Только русский язык в UI. Палитру и токены не менять.
- Перед push: `npm run lint && npm run typecheck && npm run build`.

## Хэндофф / заметки сессий

- (пусто)
