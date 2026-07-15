# ✅ Frontend AI Skill — Review Checklist

> **Use this:** after every implement or fix-bugs task, before responding to the user.
> This is the final gate — do not skip any item.

---

## 🗂️ When to Use Which Guide

| Situation                                        | Primary Guide  | Also Read   |
| ------------------------------------------------ | -------------- | ----------- |
| Building a new component, hook, page, feature    | `IMPLEMENT.md` | `SHARED.md` |
| Integrating Mastra tool or CopilotKit action     | `IMPLEMENT.md` | `SHARED.md` |
| Diagnosing or fixing a bug                       | `FIX_BUGS.md`  | `SHARED.md` |
| Reviewing code for correctness / standards       | `REVIEW.md`    | `SHARED.md` |
| Anything that involves writing or modifying code | `SHARED.md`    | —           |

> **When unsure:** start with `SHARED.md`, then pick the most specific guide.

---

## ✅ Checklist — Run Every Item Before Responding

### 🔍 Research & Planning

- [ ] Searched for existing components/hooks/utils — no duplicate definitions created?
- [ ] Plan proposed and confirmed before modifying existing code? _(implement only)_
- [ ] Only the minimum necessary code was changed? _(fix-bugs only)_

---

### 📁 Structure & Exports

- [ ] New file placed in the correct folder? (`utils/`, `hooks/`, `constants/`, `components/common/`, etc.)
- [ ] Component with little logic → `components/common/[Name]/index.tsx`?
- [ ] Component with business logic → `components/[feature]/[Name]/index.tsx`?
- [ ] Generative UI components → `components/generative/[Name]/index.tsx`?
- [ ] Mastra tools → `tools/`?
- [ ] Barrel `index.ts` updated to export the new file?
- [ ] All exports are **named exports** (no `export default` except Next.js pages/layouts)?

---

### ✂️ Component Quality

- [ ] Component file under 150 lines? If not — sub-components extracted?
- [ ] Repeated JSX blocks extracted into a reusable component?
- [ ] Logic with 3+ `useState`/`useEffect` extracted into a custom hook?
- [ ] Props interface under 6–7 props? If not — component split or props grouped?
- [ ] Loading / error / empty states all handled for data-fetching components?
- [ ] Default values added to optional props?

---

### 🧩 Agent / CopilotKit Layer Separation

- [ ] Mastra tool: throws on `!res.ok`?
- [ ] Mastra tool: validates with Zod `safeParse` and throws if shape is invalid?
- [ ] Mastra tool: no UI logic, no state, no loading indicators?
- [ ] CopilotKit action: handles all `status` values (`inProgress`, `failed`, default)?
- [ ] Generative component: guards against `undefined` data with early return?
- [ ] Generative component: no `useState`, no `useEffect`, no fetch calls?
- [ ] Chat UI: only handles stream indicator — no tool-level awareness?

---

### 🏷️ Imports & Naming

- [ ] Imports grouped in the correct order? (external → components → hooks → context → utils → services → constants → types)
- [ ] No `import React from 'react'`?
- [ ] Imports use barrel paths (`@/utils`, `@/components/common`) — not deep paths?
- [ ] Icons use `lucide-react` only — no Tabler icons?

---

### 🔒 Type Safety

- [ ] No `any` or unsafe type casts used?
- [ ] External data validated with Zod before use?
- [ ] Types used in one file only → defined in that file (no unnecessary `types/` file)?
- [ ] Types shared across files → moved to `types/`?

---

### 🎨 Styling

- [ ] No hardcoded color values anywhere (`bg-[#xxx]`, `style={{ color: '...' }}`)? Badge palette via `BADGE_CLASS_MAP` is the only exception.
- [ ] No arbitrary font sizes (`text-[Npx]`) — semantic tokens used (`text-body`, `text-meta`, etc.)?
- [ ] No `font-weight` above `500` — `font-semibold`, `font-bold`, `font-[600]` are all forbidden?
- [ ] No hardcoded spacing — standard Tailwind utilities only (`px-4`, `gap-2`), no arbitrary values (`px-[16px]`, `gap-[10px]`)?
- [ ] New color tokens added to `styles/globals.css` `@theme` block?
- [ ] Token names follow role/behavior naming? (`--color-text-primary` ✅, `--color-blue` ❌)
- [ ] New badge variant added to `BADGE_CLASS_MAP` in `constants/badge.ts`?
- [ ] `cn()` used for all conditional `className` expressions?
- [ ] No inline `style={}` for layout or color?
- [ ] No `box-shadow`, `drop-shadow`, gradient, or background image?
- [ ] `border-radius` only uses `rounded-pill`, `rounded-lg`, `rounded-md`?
- [ ] Selected/active state uses `border-2 border-border-focus` — nothing else?
- [ ] Dividers use `h-px bg-border-tertiary` only?
- [ ] Buttons are transparent with `0.5px` border — no filled/solid backgrounds?
- [ ] Primary action button label ends with `↗`?
- [ ] Text is sentence case — no ALL CAPS or Title Case in user-facing labels? (Section labels use CSS `uppercase`, not hardcoded)
- [ ] Card nesting max 2 levels?
- [ ] Dark mode works — all colors resolve from CSS variable tokens?
- [ ] Responsive — layout does not break on mobile?

---

### 🧼 Code Conventions

- [ ] Arrow functions used throughout — no `function` declarations?
- [ ] No inline functions in JSX?
- [ ] Destructuring used where possible?
- [ ] No magic numbers — values moved to named constants?
- [ ] Key functions/hooks/components have JSDoc comments?
- [ ] Defensive rendering for nullable/optional values?

---

### 🐛 Bug Fix Specific

- [ ] Root cause identified and stated clearly?
- [ ] Fix addresses root cause — not just the symptom?
- [ ] No unrelated code was changed?
- [ ] Other issues noticed (but not fixed) — reported separately?
- [ ] If bug cannot be fixed: stated clearly, explained reason, suggested concrete next step?

---

## 🚦 Gate Rule

> If **any item is unchecked**, fix it before responding.
> The checklist is not optional — it is the team standard.
