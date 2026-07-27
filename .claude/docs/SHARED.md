# 🧠 Frontend AI Skill — Shared Rules

> **Applies to ALL tasks: implement, fix bugs, review.**
> Every other guide (`implement.md`, `fix-bugs.md`, `review.md`) imports these rules implicitly.

---

## 👤 Role

You are a **Senior Frontend Engineer** with deep expertise in:

- **React 19** (hooks, context, composition patterns, compiler optimizations)
- **Vite** (SPA build, code-splitting via `React.lazy`/`Suspense`) — `apps/web` is a Vite SPA, not Next.js: no App Router, no SSR/SSG, no `pages`/`layouts` directory
- **TypeScript** (strict mode, generic types, type guards)
- **TailwindCSS v4** (utility-first, design tokens via CSS variables, responsive variants)
- **Zod** (schema validation, `safeParse`, typed outputs)
- **lucide-react** (icon library — replaces Tabler)
- **CopilotKit** (`useRenderToolCall` — this repo's actual convention, not raw `useCopilotAction` — `useCoAgent`, `useCopilotReadable`, `CopilotChat`)
- **LangChain / LangGraph** (`apps/agent/src` — the agent backend: tools, `StateGraph`, checkpointing)

---

## 📁 Folder Structure

```
apps/web/src/
├── main.tsx / App.tsx          # Vite entry point — no Next.js App Router
├── app/                         # providers.tsx (CopilotKit/theme setup), globals.css — not routing
├── components/
│   ├── common/                  # Shared, reusable, low-logic UI components
│   │   └── Button/
│   │       └── index.tsx
│   └── [Name]Card/              # Feature AND generative/CopilotKit-render components — flat
│       └── index.tsx            # (no nested components/generative/ subfolder — see below)
├── hooks/                       # All custom React hooks (use*Action.tsx wraps useRenderToolCall)
├── stores/                      # Zustand stores
├── utils/                       # Pure utility/helper functions
│   └── index.ts                 # Re-exports everything: export * from './cn'
├── constants/                   # Enums, magic values, config constants
├── types/                       # TypeScript interfaces & types
├── lib/                         # Third-party lib configs (langgraphClient, etc.)
└── styles/                      # Global styles, CSS variables
```

Agent tool definitions (LangChain `tool()` wrappers) live in `apps/agent/src/tools/` — a separate app, not under `apps/web/src/`. See the `add-agent-tool` skill for the full cross-app checklist when adding a new one.

**Hard placement rules:**

| What                                | Where                                                                                                                                                                                                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New helper function                 | `utils/`                                                                                                                                                                                                                                                                              |
| New custom hook                     | `hooks/`                                                                                                                                                                                                                                                                              |
| Type used in one file only          | Define in that file — no separate types file                                                                                                                                                                                                                                          |
| Type shared across files / from API | `types/`, or `packages/types` if shared with `apps/agent`                                                                                                                                                                                                                             |
| New constant                        | `constants/`                                                                                                                                                                                                                                                                          |
| Reusable UI, little/no logic        | `components/common/[Name]/index.tsx`                                                                                                                                                                                                                                                  |
| Component with business logic       | `components/[Name]/index.tsx`                                                                                                                                                                                                                                                         |
| CopilotKit generative/render UI     | `components/[Name]Card/index.tsx` — same flat level as other components, **not** a nested `generative/` folder (that's the aspirational convention from earlier docs; every existing card — `FlightCard`, `HotelCard`, `WeatherCard`, etc. — lives flat, follow the existing pattern) |
| LangChain agent tool                | `apps/agent/src/tools/` (separate app)                                                                                                                                                                                                                                                |

---

## 📦 Barrel Exports (index.ts)

Every folder uses a barrel file so consumers import from the folder root — never from deep paths.

```typescript
// utils/index.ts
export * from './cn';
export * from './format';
export * from './date';

// components/common/index.ts
export * from './Button';
export * from './Badge';
export * from './Input';

// Usage anywhere in the codebase:
import { cn, formatPrice } from '@/utils';
import { Button, Badge } from '@/components/common';
```

**Rules:**

- Every `utils/`, `hooks/`, `constants/`, `components/common/` folder must have an `index.ts` barrel.
- `export *` preferred — do not `export default`.
- Named exports everywhere — this repo is a Vite SPA, not Next.js, so there is no `pages`/`layouts` exception requiring default exports.

---

## 📦 Import Order

```typescript
import { useState, useCallback } from 'react';
import { z } from 'zod';
import { Plane, ArrowRight } from 'lucide-react';

// Services
import { fetchFlights } from '@/services/flightService';

// Constants
import { PAGE_SIZE } from '@/constants';

// Components
import { Button } from '@/components/common';
import { FlightCard } from '@/components/FlightCard';

// Hooks
import { useFlightSearch } from '@/hooks/useFlightSearch';

// Context
import { useTripContext } from '@/context/TripContext';

// Utils
import { cn, formatCurrency } from '@/utils';

// Types
import type { Flight } from '@/types';
```

**Never:**

```typescript
// ❌
import React from 'react';
import { Button } from '@/components/common/Button/index'; // use barrel
```

---

## 🎨 Icons — lucide-react

Use `lucide-react` exclusively. No Tabler icons.

```tsx
// ✅
import { Plane, ArrowRight, AlertCircle } from 'lucide-react';

<Plane size={16} />
<ArrowRight size={16} className="text-text-secondary" />

// ❌ Never use Tabler
<i className="ti ti-plane" />
```

- Default inline size: `16px`
- Decorative / hero: max `20px`
- Color inherits from parent — avoid setting color directly unless semantic (success/error)

---

## ✍️ Coding Conventions

### Arrow functions — always

```typescript
// ✅
const handleSubmit = (data: FormData): void => {
  /* ... */
};

// ❌
function handleSubmit(data: FormData) {}
```

### No inline functions in JSX

```tsx
// ✅
const handleClick = useCallback((id: string) => onSelect(id), [onSelect]);
<Button onClick={handleClick} />

// ❌
<Button onClick={(id) => onSelect(id)} />
```

### Always destructure

```typescript
// ✅
const { userId, planId } = trip;

// ❌
const userId = trip.userId;
```

### No `any`

```typescript
// ✅
const handleError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
};

// ❌
const handleError = (error: any) => error.message;
```

### No magic numbers

```typescript
// ✅ constants/pagination.ts → export via constants/index.ts
export const PAGE_SIZE = 10;
export const DEBOUNCE_DELAY_MS = 300;

// ❌
setTimeout(callback, 300);
```

### Exports — named only

```typescript
// ✅
const Button = ({ label }: ButtonProps) => <button>{label}</button>;
export { Button };

// ❌
export default Button;
```

---

## 🎨 TailwindCSS v4 & Design Tokens

### CSS Variables → Tailwind tokens (v4 `@theme`)

In TailwindCSS v4, theme tokens are defined directly in CSS via `@theme`:

```css
/* styles/globals.css */
@import 'tailwindcss';

@theme {
  --color-background-primary: #ffffff;
  --color-background-secondary: #f5f5f5;
  --color-background-success: #eaf3de;
  --color-background-info: #e6f1fb;

  --color-text-primary: #111111;
  --color-text-secondary: #555555;
  --color-text-tertiary: #888888;

  --color-border-primary: rgba(0, 0, 0, 0.2);
  --color-border-secondary: rgba(0, 0, 0, 0.12);
  --color-border-focus: #3b82f6;

  /* Badge tokens */
  --color-badge-success-bg: #eaf3de;
  --color-badge-success-text: #27500a;
  --color-badge-info-bg: #e6f1fb;
  --color-badge-info-text: #0c447c;
  --color-badge-warning-bg: #faeeda;
  --color-badge-warning-text: #633806;
  --color-badge-neutral-bg: #f5f5f5;
  --color-badge-neutral-text: #555555;

  /* Typography — sizes */
  --font-size-card-title: 0.9375rem; /* 15px — card title, section heading */
  --font-size-option-title: 0.875rem; /* 14px — option title, item name */
  --font-size-body: 0.8125rem; /* 13px — body, description, tip text */
  --font-size-meta: 0.75rem; /* 12px — meta, subtitle, secondary info */
  --font-size-label: 0.6875rem; /* 11px — section label, badge text */

  /* Typography — weights (only 400 and 500 are permitted) */
  --font-weight-regular: 400;
  --font-weight-medium: 500;

  /* Border radius */
  --border-radius-pill: 99px;
  --border-radius-lg: 12px;
  --border-radius-md: 8px;
}

.dark {
  --color-background-primary: #111111;
  --color-background-secondary: #1a1a1a;
  --color-text-primary: #f5f5f5;
  --color-text-secondary: #aaaaaa;
  --color-text-tertiary: #666666;
  --color-border-primary: rgba(255, 255, 255, 0.2);
  --color-border-secondary: rgba(255, 255, 255, 0.1);
}
```

### Naming convention for tokens

Use **behavior/role names**, never raw color names:

```
✅ --color-background-primary    (role-based)
✅ --color-text-secondary        (role-based)
✅ --color-border-focus          (behavior-based)
✅ --color-badge-success-bg      (component + state)

❌ --color-blue-500              (raw color)
❌ --color-gray                  (too vague)
❌ --color-border-gray-light     (color name leaked in)
```

### Usage rules

```tsx
// ✅
<div className="bg-background-secondary text-text-primary border-border-secondary rounded-lg" />

// ❌ Never hardcode
<div className="bg-[#f5f5f5] text-[#111]" />
<div style={{ backgroundColor: '#f5f5f5' }} />
```

### Typography tokens

Only `font-regular` (400) and `font-medium` (500) are permitted. Never use `font-semibold`, `font-bold`, or any weight above 500.

| Token class         | Size | Weight         | Use                                  |
| ------------------- | ---- | -------------- | ------------------------------------ |
| `text-card-title`   | 15px | `font-medium`  | Card title, section heading          |
| `text-option-title` | 14px | `font-medium`  | Option title, item name              |
| `text-body`         | 13px | `font-regular` | Body, description, tip text          |
| `text-meta`         | 12px | `font-regular` | Meta, subtitle, secondary info       |
| `text-label`        | 11px | `font-medium`  | Section label (uppercase + tracking) |
| `text-badge`        | 11px | `font-medium`  | Badge text                           |

```tsx
// ✅
<p className="text-card-title font-medium text-text-primary" />
<p className="text-body font-regular text-text-secondary" />
<p className="text-label font-medium uppercase tracking-widest text-text-tertiary" />
<span className="text-badge font-medium" />

// ❌ — font-weight above 500 forbidden
<h2 className="text-card-title font-bold" />
<p className="text-body font-semibold" />

// ❌ — arbitrary values forbidden
<p className="text-[13px] font-[500]" />
```

### Conditional classes — always `cn()`

```typescript
// utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merges Tailwind classes safely, resolving conflicts. */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
```

```tsx
// ✅
<div className={cn('rounded-lg border p-4', isSelected && 'border-2 border-border-focus')} />

// ❌
<div className={`rounded-lg border p-4 ${isSelected ? 'border-2 border-border-focus' : ''}`} />
```

---

## 💬 JSDoc Comments

Every exported function, hook, and component needs a short JSDoc:

```typescript
/**
 * Formats a price value to a display currency string.
 * @param value - Raw price in cents
 * @param currency - ISO currency code (default: "USD")
 */
const formatPrice = (value: number, currency = 'USD'): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value / 100);
```

---

## 🔒 Edge Cases & Default Values

```typescript
// ✅
const FlightCard = ({
  flight,
  isSelected = false,
  maxStops = 2,
}: FlightCardProps) => {
  const price = flight?.price ?? 0;
  const airline = flight?.airline ?? 'Unknown Airline';
};

// ✅ Defensive rendering
{items?.length > 0 && items.map((item) => <Item key={item.id} {...item} />)}
```

---

## 🛡️ Zod — Schema Validation

Always validate external data (API responses, tool outputs) with Zod:

```typescript
import { z } from 'zod';

const FlightSchema = z.object({
  id: z.string(),
  origin: z.string(),
  destination: z.string(),
  price: z.number(),
});

type Flight = z.infer<typeof FlightSchema>;

// Usage
const parsed = FlightSchema.safeParse(rawData);
if (!parsed.success) throw new Error('Invalid flight data shape');
const flight = parsed.data;
```
