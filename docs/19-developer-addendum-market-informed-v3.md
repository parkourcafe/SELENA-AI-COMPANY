# 19. Developer Addendum: Market-informed Conversion v3

Этот документ добавляет к текущему ТЗ конкурентный и воронкообразующий слой.

## Что изменилось после конкурентного анализа

Сайт KORA должен теперь включать три уровня:

1. **Premium service website** — спокойно, дорого, структурно.
2. **Diagnostic funnel** — посетитель считает рутину, выбирает задачу и идёт к AI-карте.
3. **Content/product ladder foundation** — сайт готовит будущую рассылку, мини-курс, библиотеку и сопровождение.

## Новые обязательные блоки

### Newsletter / content engine CTA

Добавить блок на главную после TrustBoundarySection или перед FAQ.

Headline:

```text
AI без хаоса: одна бизнес-задача в неделю
```

Copy:

```text
Короткие разборы для предпринимателей и команд: где AI может помочь, какой сценарий собрать, какой инструмент выбрать и какой ошибки избежать.
```

Fields:

- email or Telegram handle;
- consent checkbox;
- success state;
- TODO backend integration.

CTA:

```text
Получать разборы
```

### Lead magnet tiles

На `/free-ai-map` добавить блок:

```text
Можно начать с бесплатного формата
```

Cards:

1. AI-карта возможностей
2. Чеклист “7 мест, где AI убирает рутину”
3. 5-дневный мини-курс “AI без хаоса”

For MVP, only AI-map form needs to be implemented. Checklist and mini-course can be marked as “скоро” only if not connected.

### Service paths by business goal

Add to homepage and `/services`:

```text
Выберите, что хотите улучшить
```

Cards:

- Заявки и переписки → AI-консьерж / автоматизация
- Контент → AI-контент-система
- Команда → AI-обучение
- CRM / Notion / таблицы → AI-автоматизация
- Документы и инструкции → AI-база знаний
- Не знаю, с чего начать → AI-аудит

## Updated component list

Add:

```text
components/sections/NewsletterCTASection.tsx
components/sections/LeadMagnetTiles.tsx
components/sections/BusinessGoalPaths.tsx
components/forms/NewsletterSignupForm.tsx
```

Already required:

```text
components/sections/TimeLossCalculator.tsx
components/sections/GoalSelectorSection.tsx
components/sections/ProductLadderSection.tsx
components/sections/FounderStorySection.tsx
components/sections/AIMapCTASection.tsx
components/forms/AIMapBriefForm.tsx
```

## Routes

Required now:

```text
/
/services
/ai-training
/ai-automation
/ai-content
/about
/contact
/free-ai-map
```

Optional but recommended placeholder-free if content exists:

```text
/privacy
/terms
```

Future only, not in main nav yet:

```text
/blog
/kora-ai-library
/free-checklist
/mini-course
/community
/cases
```

## Updated navigation

Desktop:

```text
Услуги
Обучение
Автоматизация
AI-карта
Обо мне
Контакты
[Получить AI-карту]
```

Mobile: same order, CTA pinned at bottom of menu if practical.

## Copy integrity rules after competitor analysis

Do not copy or claim:

- “Save 10-15 hours per week” as a guaranteed promise.
- “Certified AI Operator” unless KORA actually creates a certification.
- “2M readers”, “clients include”, “trusted by” or any competitor proof.
- “All courses, one membership” until KORA AI Library exists.
- “Build a SaaS” unless selling a specific product-building offer.
- “Bank-grade security”, “enterprise-ready”, “compliance-certified” unless legally verified.

Use instead:

```text
предварительная оценка
кандидаты на AI-сценарии
начинаем с 1 процесса
человеческая проверка остаётся в системе
без сложного кода
после диагностики станет понятно, что внедрять первым
```

## Definition of Done additions

Before final response from Claude Code, verify:

- homepage includes the AI-map funnel;
- newsletter block exists or is intentionally deferred with TODO;
- no unsupported competitor-inspired claims are present;
- no fake prices are shown;
- calculator language is conservative;
- lead magnet CTAs point to `/free-ai-map` or a real form;
- mobile form experience is usable;
- route `/free-ai-map` is implemented.
