# 🏗️ Frontend AI Skill — Implement Guide

> **Use this when:** building a new feature, component, hook, page, or agent integration.
> **Also read:** `shared.md` — all shared rules apply here too.
> **Adding a whole new agent tool/domain?** Use the `add-agent-tool` skill instead of reconstructing the checklist from this doc — it's built from tracing an existing domain's real wiring end to end.

---

## ⚙️ Workflow Before Writing Any Code

1. **Read all relevant context** — existing files, folders, components.
2. **Search for existing components/utils/hooks** — never redefine what already exists.
3. **Propose a plan** (which files will be created/changed and why).
4. **Wait for confirmation** before executing.
5. **Self-review** output against `review.md` checklist before responding.

---

## 🎨 Design System — Non-Negotiable

> Every component must follow these rules exactly. No exceptions, even if another approach looks better.

### ❌ Never Do

- Hardcode any color value — badge palette is the **only** exception (see below)
- Use `font-weight` above `500` — `font-semibold`, `font-bold`, `600`, `700` are all forbidden
- Use `box-shadow` or `drop-shadow`
- Use gradients or background images
- Use ALL CAPS or Title Case in labels — sentence case only
- Add decorative dividers other than `0.5px solid var(--color-border-tertiary)`
- Use `border-radius` other than `var(--border-radius-pill)`, `var(--border-radius-lg)`, `var(--border-radius-md)`
- Use `font-size` smaller than `11px` or larger than `15px` (exception: numeric displays e.g. temperature)
- Nest more than 2 levels of cards
- Apply color directly to text unless it is a semantic state (success, info, tertiary)

### ✅ Always Do

- All colors via CSS variable tokens — never raw hex or rgba inline
- Dark mode support — all colors resolve from CSS variables automatically
- Sentence case for all user-facing text
- Card padding via `var(--spacing-card-px)` / `var(--spacing-card-py)` tokens
- Option row padding via `var(--spacing-row-px)` / `var(--spacing-row-py)` tokens
- Gaps via `var(--spacing-section-gap)`, `var(--spacing-inline-gap)`, `var(--spacing-card-gap)` tokens
- Section labels always: `text-label font-medium uppercase tracking-widest text-text-tertiary`
- Dividers always: `h-px bg-border-tertiary` (maps to `height: 0.5px`)
- Selected/active state always: `border-2 border-border-focus` — nothing else

---

### 📐 Spacing — Reference

Use standard Tailwind spacing utilities (`px-4`, `py-3`, `gap-2`, etc.). Never use arbitrary values.

| Usage                                              | Tailwind class |
| -------------------------------------------------- | -------------- |
| Card padding                                       | `px-5 py-4`    |
| Option row padding                                 | `px-4 py-3`    |
| Gap between card sections                          | `gap-3`        |
| Gap between inline elements (chips, badges, icons) | `gap-2`        |
| Gap between cards in list or grid                  | `gap-2`        |
| Inner chip/pill padding                            | `px-2.5 py-1`  |
| Button padding (default)                           | `px-4 py-1.5`  |
| Button padding (compact, inside cards)             | `px-3 py-1`    |

```tsx
// ✅
<div className="px-5 py-4" />
<div className="gap-2" />

// ❌ — arbitrary values are magic numbers
<div className="px-[20px]" />
<div className="gap-[10px]" />
```

---

### 🔤 Typography Scale

Only `font-regular` (400) and `font-medium` (500) are permitted. Nothing above 500.

| Token class         | Size | Weight         | Use case                             |
| ------------------- | ---- | -------------- | ------------------------------------ |
| `text-card-title`   | 15px | `font-medium`  | Card title, section heading          |
| `text-option-title` | 14px | `font-medium`  | Option row title, item name          |
| `text-body`         | 13px | `font-regular` | Body text, description, tip          |
| `text-meta`         | 12px | `font-regular` | Meta info, subtitle, timestamp       |
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

---

### 🏷️ Badge Palette — Hardcoded Exception

Badges are the **only place** hardcoded color values are allowed. All badge colors are defined as CSS variable tokens and accessed via `BADGE_CLASS_MAP`.

```typescript
// constants/badge.ts
export type BadgeVariant = 'cheapest' | 'popular' | 'fastest' | 'nature' | 'culture' | 'food';

/**
 * Maps badge variants to Tailwind utility classes.
 * Colors come from CSS variable tokens — not raw hex.
 * To add a variant: add tokens to globals.css @theme, add entry here.
 */
export const BADGE_CLASS_MAP: Record<BadgeVariant, string> = {
  cheapest: 'bg-badge-cheapest-bg text-badge-cheapest-text',
  popular: 'bg-badge-popular-bg text-badge-popular-text',
  fastest: 'bg-badge-fastest-bg text-badge-fastest-text',
  nature: 'bg-badge-nature-bg text-badge-nature-text',
  culture: 'bg-badge-culture-bg text-badge-culture-text',
  food: 'bg-badge-food-bg text-badge-food-text',
};
```

```tsx
// components/common/Badge/index.tsx
import { cn } from '@/utils';
import { BADGE_CLASS_MAP, type BadgeVariant } from '@/constants/badge';

interface BadgeProps {
  variant: BadgeVariant;
  label: string;
  className?: string;
}

/** Reusable badge. Colors via CSS variable tokens — never hardcoded in JSX. */
const Badge = ({ variant, label, className }: BadgeProps) => (
  <span
    className={cn(
      'rounded-pill text-badge inline-flex items-center px-2 py-0.5 font-medium',
      BADGE_CLASS_MAP[variant],
      className
    )}
  >
    {label}
  </span>
);

export { Badge };
```

---

### 🧱 Component Anatomy — Copy These Exactly

These are the canonical structures for each UI pattern. Always use them as the base.

#### 1. Option Row (flight / hotel / item)

```tsx
<div
  className={cn(
    'bg-background-primary flex items-center justify-between gap-3 rounded-lg px-4 py-3',
    isSelected ? 'border-border-focus border-2' : 'border-border-tertiary border'
  )}
>
  <div>
    <p className="text-option-title text-text-primary font-medium">Title</p>
    <p className="text-meta font-regular text-text-secondary">Meta info</p>
  </div>
  <div className="flex items-center gap-2">
    <Badge variant="cheapest" label="Cheapest" />
    <span className="text-option-title text-text-primary font-medium">$120</span>
    <Button size="compact">Select</Button>
  </div>
</div>
```

#### 2. Section Label

```tsx
<p className="text-label text-text-tertiary font-medium uppercase tracking-widest">
  Outbound flight
</p>
```

#### 3. Divider

```tsx
<div className="bg-border-tertiary h-px" />
```

#### 4. Chip / Inline Tag

```tsx
<div className="bg-background-secondary flex items-center gap-2 rounded-md px-2.5 py-1">
  <PlaneIcon size={14} className="text-text-secondary" />
  <span className="text-meta font-regular text-text-secondary">Hanoi</span>
</div>
```

#### 5. Confirm Banner

```tsx
<div className="border-border-success bg-background-success flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
  <div className="flex items-center gap-2">
    <CheckCircle size={20} className="text-text-success" />
    <div>
      <p className="text-option-title text-text-success font-medium">Item selected</p>
      <p className="text-meta font-regular text-text-success opacity-80">Detail line</p>
    </div>
  </div>
  <div className="flex gap-2">
    <Button size="compact">Change</Button>
    <Button size="compact" className="text-text-success">
      Confirm ↗
    </Button>
  </div>
</div>
```

#### 6. Place Card (grid item)

```tsx
<div className="border-border-tertiary bg-background-primary rounded-lg border p-3">
  <div className="mb-1 flex items-start justify-between">
    <span className="text-body text-text-primary font-medium">Place name</span>
    <Plus size={16} className="text-text-tertiary" />
  </div>
  <Badge variant="nature" label="Nature" />
  <p className="text-meta font-regular text-text-secondary mt-1.5">~2 hours</p>
</div>
```

#### 7. Local Tips Row

```tsx
<div className="gap-inline flex items-start">
  <Lightbulb size={16} className="text-text-secondary mt-0.5" />
  <div>
    <p className="text-body text-text-primary font-medium">Tip title</p>
    <p className="text-meta font-regular text-text-secondary">Tip description</p>
  </div>
</div>
```

---

### 🔘 Button Rules

- Background: always transparent — never filled/solid
- Border: `0.5px` solid, `var(--border-radius-md)`
- Font size: `text-body` (default), `text-meta` (compact inside cards)
- Primary/confirm action: append `↗` to label → `"Confirm ↗"`, `"Done ↗"`
- Destructive/cancel: same neutral style — no red color
- Never use `font-weight` above `font-medium`

```tsx
// ✅
<button className="rounded-md border border-border-secondary px-4 py-1.5 text-body font-regular text-text-primary">
  Select
</button>

// ✅ Primary action
<button className="rounded-md border border-border-secondary px-4 py-1.5 text-body font-regular text-text-primary">
  Confirm ↗
</button>

// ❌
<button className="rounded-md bg-blue-500 text-white font-bold">Select</button>
```

---

## ✂️ Component Splitting Rules

A single file does **one thing**. Split when any of these triggers fire:

| Signal                                       | Action                         |
| -------------------------------------------- | ------------------------------ |
| File exceeds **150 lines**                   | Extract sub-components         |
| JSX block repeats more than once             | Extract into its own component |
| Section of JSX has a distinct responsibility | Extract even if used once      |
| More than **3 `useState` / `useEffect`**     | Extract into a custom hook     |
| Props interface exceeds **6–7 props**        | Split component or group props |

### File structure

```
components/
├── common/
│   ├── Button/
│   │   └── index.tsx
│   ├── Badge/
│   │   └── index.tsx
│   └── index.ts          ← barrel: export * from './Button' etc.
├── FlightCard/
│   ├── index.tsx
│   ├── FlightCardHeader.tsx
│   ├── FlightCardPricing.tsx
│   └── FlightCardActions.tsx
└── WeatherCard/           ← CopilotKit-render (generative) components live flat
    └── index.tsx          ← alongside feature components, not under a generative/ subfolder
```

### common/ vs feature components

```
components/common/   → reusable, minimal logic, used in many places
                       Button, Badge, Input, Modal, Skeleton, EmptyState, Divider

components/[Name]/    → has business logic and/or is a CopilotKit-rendered generative
                       component, used in a specific feature — FlightCard, HotelCard,
                       WeatherCard, TripSummaryCard
```

### Extract repeated JSX

```tsx
// ❌
<div>
  <span className="text-meta font-regular text-text-tertiary">Origin</span>
  <span className="text-body font-medium text-text-primary">{flight.origin}</span>
</div>
<div>
  <span className="text-meta font-regular text-text-tertiary">Destination</span>
  <span className="text-body font-medium text-text-primary">{flight.destination}</span>
</div>

// ✅
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <span className="text-meta font-regular text-text-tertiary">{label}</span>
    <span className="text-body font-medium text-text-primary">{value}</span>
  </div>
);
```

### Extract logic into hooks

```tsx
// ❌ Logic sitting in component
const FlightList = () => {
  const [flights, setFlights] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  useEffect(() => {
    /* fetch */
  }, [page]);
};

// ✅ Logic extracted — component only renders
const FlightList = () => {
  const { flights, isLoading, error, page, setPage } = useFlightList();
  const { selected, handleSelect } = useFlightSelection();
};
```

---

## 🛡️ Error / Loading / Empty States — Always Required

Every data-fetching component must handle all four states:

```tsx
const FlightList = ({ params }: FlightListProps) => {
  const { data, isLoading, error, refetch } = useFlightSearch(params);

  if (isLoading) {
    return (
      <div className="gap-card flex flex-col">
        {Array.from({ length: PAGE_SIZE }).map((_, i) => (
          <FlightCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorBoundaryFallback message="Failed to load flights" onRetry={refetch} />;
  }

  if (!data?.length) {
    return <EmptyState message="No flights found for this route." />;
  }

  return (
    <div className="gap-card flex flex-col">
      {data.map((flight) => (
        <FlightCard key={flight.id} flight={flight} onSelect={handleSelect} />
      ))}
    </div>
  );
};
```

---

## ⚡ Performance

### Code splitting

This repo is a Vite SPA — use `React.lazy` + `Suspense`, not Next.js's `next/dynamic`:

```typescript
import { lazy, Suspense } from 'react';

const FlightMap = lazy(() => import('@/components/FlightMap'));

// usage
<Suspense fallback={<MapSkeleton />}>
  <FlightMap />
</Suspense>
```

### Memoization — apply when needed, never over-apply

```typescript
// ✅ Expensive computed value
const sortedFlights = useMemo(() => flights.slice().sort((a, b) => a.price - b.price), [flights]);

// ✅ Callback passed to child
const handleSelect = useCallback((id: string) => setSelected(id), []);

// ✅ Expensive child component
const FlightCard = memo(({ flight, onSelect }: FlightCardProps) => {
  /* ... */
});
```

---

## 🤖 Agent + CopilotKit — 4-Layer Architecture

Each layer has a single responsibility. Never mix concerns across layers.

```
Layer 1 — Agent Tool          throws errors, validates with Zod
Layer 2 — CopilotKit Action   handles status + routes to UI state
Layer 3 — Generative UI       renders data, never fetches
Layer 4 — Chat UI             handles stream indicators
```

### Layer 1 — Agent Tool (`apps/agent/src/tools/`)

**Responsibility:** fetch, validate with Zod, throw on failure. No UI logic.

New tools go in `apps/agent/src/tools/`. LangChain's `tool()` has a contract to watch for: **the execute function must return a string**, typically `JSON.stringify(result)`. Returning a raw object compiles fine but breaks the CopilotKit action's ability to parse `result` at runtime — see the `review-copilotkit-layers` skill for the full list of this-stack-specific failure modes.

```typescript
// tools/weather.ts (apps/agent/src/tools/weather.ts, real pattern)
import { tool } from '@langchain/core/tools';
import { getWeather } from '../services/weather';
import { WeatherInputSchema } from '../schemas/weather';
import { TOOL_ERROR_MESSAGES } from '../constants';

export const weatherTool = tool(
  async ({ city, days }) => {
    try {
      const result = await getWeather({ city, days });
      return JSON.stringify(result); // must be a string
    } catch (error) {
      return JSON.stringify({
        error: error instanceof Error ? error.message : TOOL_ERROR_MESSAGES.WEATHER,
      });
    }
  },
  {
    name: 'weatherTool',
    description: 'Get current weather conditions and forecast for a destination.',
    schema: WeatherInputSchema,
  }
);
```

The service behind the tool (`services/weather.ts`) does the actual fetch/validate work: check `res.ok` → throw with a clear message, `safeParse` the response with Zod → throw if the shape is wrong, never render UI or set state.

### Layer 2 — CopilotKit Action

**Responsibility:** bridge tool status → UI state. The only layer that knows the status values below.

This repo's actual convention is `useRenderToolCall`, not raw `useCopilotAction`:

```typescript
// hooks/useWeatherAction.tsx (apps/web/src/hooks, real pattern)
useRenderToolCall({
  name: TOOL_NAMES.WEATHER,
  description: 'Show current weather for a location',
  parameters: [{ name: 'location', type: 'string', description: 'City name', required: true }],
  render: ({ status, result, error }) => {
    if (isToolPending(status)) return <WeatherCardSkeleton />;
    if (status === 'failed') return <ErrorCard message={error ?? 'Failed to load weather'} />;
    return <WeatherCard data={result} />;
  },
});
```

**Rules:**

- Map every `status` value — never leave a case unhandled (a hook that only special-cases the loading status silently passes an undefined/error `result` into the generative component on failure)
- Pass clean `result` down to generative component — no async in the component
- `error` message comes from the tool's `throw` / `JSON.stringify({ error })`

### Layer 3 — Generative UI (`apps/web/src/components/`)

**Responsibility:** render clean data. Stateless. Follows design system exactly. Never fetches.

```tsx
// components/WeatherCard/index.tsx
import { Cloud } from 'lucide-react';
import type { WeatherData } from '@/types';

interface WeatherCardProps {
  data?: WeatherData;
}

/**
 * Renders weather data passed from the CopilotKit action result.
 * Loading/error states are handled by the layer above — not here.
 */
const WeatherCard = ({ data }: WeatherCardProps) => {
  if (!data) return null;

  return (
    <div className="gap-section border-border-tertiary bg-background-primary px-card py-card flex items-center rounded-lg border">
      <Cloud size={20} className="text-text-secondary" />
      <div>
        <p className="text-option-title text-text-primary font-medium">{data.location}</p>
        <p className="text-meta font-regular text-text-secondary">
          {data.temperature}° · {data.condition}
        </p>
      </div>
    </div>
  );
};

export { WeatherCard };
```

**Rules:**

- `if (!data) return null` — never crash on undefined
- No `useState`, no `useEffect`, no fetch calls
- Follows design system — same token classes, same spacing, same typography

### Layer 4 — Chat UI

**Responsibility:** stream indicators only. No knowledge of individual tool states.

```tsx
<CopilotChat Messages={CustomMessages} Input={CustomInput} />
```

### Layer summary

| Layer                | Loading                  | Error                                 |
| -------------------- | ------------------------ | ------------------------------------- |
| Agent Tool           | —                        | `throw` / `JSON.stringify({ error })` |
| CopilotKit Action    | `<Skeleton />`           | `<ErrorCard />`                       |
| Generative Component | `if (!data) return null` | —                                     |
| Chat UI              | Stream indicator         | —                                     |

---

## 🤖 CopilotKit — useCopilotReadable

```typescript
useCopilotReadable({
  description: "The user's current trip plan including selected flights and hotels",
  value: tripPlan,
});
```

---

## 📱 Responsive — Always Required

```tsx
// ✅ Grid responsive
<div className="grid grid-cols-1 gap-card sm:grid-cols-2 lg:grid-cols-3" />

// ✅ Stack → row
<div className="flex flex-col items-start gap-card sm:flex-row sm:items-center" />

// ✅ Truncation
<p className="truncate max-w-[200px] sm:max-w-none" />
```
