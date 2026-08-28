---
version: 'alpha'
name: 'Travel Planner Assistant'
description: 'Conversational travel-planning UI — flat, minimal, sky-blue accent, full light/dark support. Tokens below are the light (default) values; see the Colors section for dark overrides.'
colors:
  background.primary: '#ffffff'
  background.secondary: '#e0f2fe'
  background.success: '#e6f8f0'
  background.info: '#e6f1fb'
  background.recommended: '#e6f8f5'
  background.confirm: '#f0eefc'
  background.page: '#f9f9f9'
  text.primary: '#1c2a3a'
  text.secondary: '#4a5c70'
  text.tertiary: '#7b8a9a'
  border.tertiary: 'rgba(0, 0, 0, 0.08)'
  border.secondary: 'rgba(0, 0, 0, 0.15)'
  border.info: '#3b82f6'
  scrollbar.thumb: 'rgba(28, 42, 58, 0.144)'
  scrollbar.thumbHover: 'rgba(28, 42, 58, 0.242)'
  scrollbar.track: 'rgba(28, 42, 58, 0.08)'
  badge.successBg: '#d1fae5'
  badge.successText: '#065f46'
  badge.primaryBg: '#dbeafe'
  badge.primaryText: '#1e40af'
  badge.warningBg: '#fef3c7'
  badge.warningText: '#92400e'
  badge.secondaryBg: '#d1fae5'
  badge.secondaryText: '#065f46'
  badge.accentBg: '#e0e7ff'
  badge.accentText: '#4338ca'
  badge.dangerBg: '#fee2e2'
  badge.dangerText: '#991b1b'
  sidebar.bg: '#f8fafc'
  sidebar.border: '#e2e8f0'
  sidebar.itemActive: '#d1e3f8'
  sidebar.itemHover: '#dbeafe'
  sidebar.text: '#378add'
  sidebar.textMuted: '#4a5c70'
  sidebar.label: '#7b8a9a'
  sidebar.dotActive: '#1e40af'
  sidebar.dotIdle: '#b0c4de'
  userBubbleText: '#ffffff'
  gradient.backgroundStart: '#f7fbff'
  gradient.backgroundEnd: '#eef6ff'
  gradient.assistantStart: 'rgba(96, 165, 250, 0.85)'
  gradient.assistantEnd: 'rgba(129, 140, 248, 0.9)'
  airlineIcon.danger: '#d32f2f'
  airlineIcon.accent: '#7b1fa2'
  airlineIcon.primary: '#1565c0'
  airlineIcon.success: '#2e7d32'
  airlineIcon.warning: '#e65100'
  iconOnVivid: '#ffffff'
  icon.time: '#d97706'
  icon.ticket: '#7c3aed'
  icon.link: '#2563eb'
  icon.transport: '#0891b2'
  icon.morning: '#f59e0b'
  icon.afternoon: '#ea580c'
  icon.evening: '#4f46e5'
  icon.money: '#059669'
  brand.50: '#edf4fd'
  brand.100: '#c3dcf7'
  brand.500: '#378add'
  brand.600: '#2d73c0'
  brand.700: '#235ba0'
  brand.900: '#0e2a4a'
typography:
  display: { size: '2rem', lineHeight: 1.3 }
  heading: { size: '1.125rem', lineHeight: 1.4 }
  card-title: { size: '0.9375rem', lineHeight: 1.4, weight: 500 }
  option-title: { size: '0.875rem', lineHeight: 1.4, weight: 500 }
  body: { size: '0.8125rem', lineHeight: 1.5, weight: 400 }
  meta: { size: '0.75rem', lineHeight: 1.5, weight: 400 }
  label: { size: '0.6875rem', lineHeight: 1.4, weight: 500 }
  badge: { size: '0.6875rem', lineHeight: 1.2, weight: 500 }
rounded:
  md: '8px'
  lg: '12px'
  pill: '99px'
spacing:
  card: 'px-5 py-4'
  row: 'px-4 py-3'
  section-gap: 'gap-3'
  inline-gap: 'gap-2'
  card-gap: 'gap-2'
  chip: 'px-2.5 py-1'
  button: 'px-4 py-1.5'
  button-compact: 'px-3 py-1'
components:
  badge.success: { bg: 'color.badge.successBg', text: 'color.badge.successText' }
  badge.primary: { bg: 'color.badge.primaryBg', text: 'color.badge.primaryText' }
  badge.warning: { bg: 'color.badge.warningBg', text: 'color.badge.warningText' }
  badge.secondary: { bg: 'color.badge.secondaryBg', text: 'color.badge.secondaryText' }
  badge.accent: { bg: 'color.badge.accentBg', text: 'color.badge.accentText' }
  badge.danger: { bg: 'color.badge.dangerBg', text: 'color.badge.dangerText' }
  button:
    {
      background: 'transparent',
      border: '0.5px solid color.border.secondary',
      radius: 'rounded.md',
    }
---

## Overview

Travel Planner Assistant is a conversational AI travel-planning UI (flights, hotels, routes, weather, local tips, itineraries) built with CopilotKit generative UI cards inside a chat interface. The visual language is deliberately flat and quiet: no drop shadows on content surfaces, no gradients or background images on cards, no font weight above medium, sentence case everywhere. The one accent is a sky-blue brand scale (`brand.50`–`brand.900`, anchored at `#378add`) used sparingly (links, focus states, sidebar accents). The app fully supports light and dark themes — every token below except the static brand and airline-icon palettes flips automatically via a `.dark` class toggle.

This file is the human- and AI-agent-readable design contract. Browser runtime values live in `apps/web/src/styles/variables.css` (raw CSS custom properties, light `:root` + `.dark` override) and `apps/web/src/styles/theme.css` (Tailwind v4 mappings). A design change must update this contract and its runtime representation together. If another repository document conflicts with this file, resolve the conflict in the same change rather than silently treating either copy as stale.

## Colors

Tokens are named by **role**, never by raw color (`background.info`, not `blue-100`) — a token's name should describe what it's _for_, so its value can change per theme without the name lying.

| Token                                                             | Light             | Dark                                         |
| ----------------------------------------------------------------- | ----------------- | -------------------------------------------- |
| `background.primary`                                              | `#ffffff`         | `#0a192f`                                    |
| `background.secondary`                                            | `#e0f2fe`         | `#0d1f35`                                    |
| `background.success`                                              | `#e6f8f0`         | `#122b23`                                    |
| `background.info`                                                 | `#e6f1fb`         | `#112d52`                                    |
| `background.recommended`                                          | `#e6f8f5`         | `#11324d`                                    |
| `background.confirm`                                              | `#f0eefc`         | `#25214d`                                    |
| `background.page`                                                 | `#f9f9f9`         | `#0b2540`                                    |
| `text.primary`                                                    | `#1c2a3a`         | `#e6f1ff`                                    |
| `text.secondary`                                                  | `#4a5c70`         | `#a8c8e4`                                    |
| `text.tertiary`                                                   | `#7b8a9a`         | `#88a2be`                                    |
| `border.tertiary`                                                 | `rgba(0,0,0,.08)` | `rgba(136,162,190,.2)`                       |
| `border.secondary`                                                | `rgba(0,0,0,.15)` | `rgba(136,162,190,.3)`                       |
| `border.info`                                                     | `#3b82f6`         | `#5d90b8`                                    |
| `sidebar.*`                                                       | see frontmatter   | separate dark set in `variables.css` `.dark` |
| `icon.time/ticket/link/transport/morning/afternoon/evening/money` | see frontmatter   | separate dark set in `variables.css` `.dark` |

**Badges are the only place a hardcoded color value is allowed** in a component — every other color must resolve through a CSS variable token so dark mode "just works." `badge.*` colors still come from tokens (`badge.successBg`/`badge.successText`, etc.), never raw hex in JSX — "hardcoded" here means hex values are permitted to originate _in the token definitions themselves_ for badges specifically, unlike every other role.

Two palettes are **intentionally static** (identical in light and dark, never theme-switched): the `brand.*` sky-blue scale, and `airlineIcon.*` (danger/accent/primary/success/warning) used for airline avatar backgrounds — these are brand/identity colors, not surface colors, so they don't flip with theme.

## Typography

Font family: Inter (`--font-sans`), falling back to `system-ui, sans-serif`.

| Class               | Size | Weight        | Use                                  |
| ------------------- | ---- | ------------- | ------------------------------------ |
| `text-card-title`   | 15px | medium (500)  | Card title, section heading          |
| `text-option-title` | 14px | medium (500)  | Option row title, item name          |
| `text-body`         | 13px | regular (400) | Body text, description, tip          |
| `text-meta`         | 12px | regular (400) | Meta info, subtitle, timestamp       |
| `text-label`        | 11px | medium (500)  | Section label (uppercase + tracking) |
| `text-badge`        | 11px | medium (500)  | Badge text                           |

`display` (32px) and `heading` (18px) tokens exist for larger contexts outside these cards. **Only `font-regular` (400) and `font-medium` (500) are permitted in any component** — `font-semibold`/`font-bold` (600/700) exist as raw weight tokens in CSS but must never be applied in generative UI or chat components. All user-facing text is sentence case — no ALL CAPS, no Title Case.

## Layout

| Usage                                              | Class         |
| -------------------------------------------------- | ------------- |
| Card padding                                       | `px-5 py-4`   |
| Option row padding                                 | `px-4 py-3`   |
| Gap between card sections                          | `gap-3`       |
| Gap between inline elements (chips, badges, icons) | `gap-2`       |
| Gap between cards in a list/grid                   | `gap-2`       |
| Inner chip/pill padding                            | `px-2.5 py-1` |
| Button padding (default)                           | `px-4 py-1.5` |
| Button padding (compact, inside cards)             | `px-3 py-1`   |

Never use arbitrary values (`px-[20px]`, `gap-[10px]`) — always the standard Tailwind spacing scale. Responsive layouts stack vertically on mobile and switch to row/grid at `sm:`/`lg:` breakpoints (e.g. `flex-col sm:flex-row`, `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`).

## Elevation & Depth

Four shadow tokens exist (`--shadow`, `--shadow-soft`, `--shadow-input-hover`, `--shadow-input-focus`, each with distinct light/dark values), but they are reserved for **chrome-level surfaces only** — the chat input's hover/focus states and page-level background gradients. Generative UI components (cards, badges, buttons, option rows) must **never** add `box-shadow` or `drop-shadow` themselves; depth in cards comes from a `border` + subtle background-color contrast, not shadow. This is why shadow tokens exist in the palette despite "no box-shadow" being a hard component rule — the two apply to different layers of the UI.

## Shapes

| Token          | Value | Use                         |
| -------------- | ----- | --------------------------- |
| `rounded.pill` | 99px  | Badges, chips               |
| `rounded.lg`   | 12px  | Cards                       |
| `rounded.md`   | 8px   | Option rows, buttons, chips |

No other `border-radius` value is permitted. Dividers are always `h-px bg-border-tertiary` (renders as a 0.5px hairline) — no other decorative divider style.

`rounded-full` is permitted only for square icon-only controls whose circular shape communicates a compact action. It is not a substitute for the documented card, row, chip, or text-button radii.

## Components

**Badges** — the only hardcoded-color exception, driven entirely by a `BADGE_CLASS_MAP` lookup (`bg-badge-{variant}-bg text-badge-{variant}-text`), never inline hex. Variants map 1:1 to the `badge.*` color tokens above.

**Buttons** — background always transparent (never filled/solid), `0.5px` border using `border.secondary`, `rounded.md`. Primary/confirm actions append `↗` to the label (`"Confirm ↗"`, `"Done ↗"`); destructive/cancel actions use the same neutral style — never red.

```tsx
<button className="border-border-secondary text-body font-regular text-text-primary rounded-md border px-4 py-1.5">
  Confirm ↗
</button>
```

**Option row** (flight/hotel/item) — the most common card pattern: primary background, border that becomes `border-2 border-border-focus` when selected, title + meta on the left, badge/price/action on the right.

```tsx
<div className="bg-background-primary border-border-tertiary flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
  <div>
    <p className="text-option-title text-text-primary font-medium">Title</p>
    <p className="text-meta font-regular text-text-secondary">Meta info</p>
  </div>
  <div className="flex items-center gap-2">
    <Badge variant="cheapest" label="Cheapest" />
    <span className="text-option-title text-text-primary font-medium">$120</span>
  </div>
</div>
```

See `.claude/docs/IMPLEMENT.md` for the full canonical set (section label, chip, confirm banner, place card, local-tips row) — not duplicated here to avoid this file drifting out of sync with the enforced version.

## Do's and Don'ts

**Never:**

- Hardcode any color value — the badge palette is the only exception
- Use `font-weight` above 500 — `font-semibold`, `font-bold`, `600`, `700` are all forbidden
- Use `box-shadow` or `drop-shadow` on a component
- Use gradients or background images on a component
- Use ALL CAPS or Title Case in labels — sentence case only
- Add decorative dividers other than `0.5px solid var(--color-border-tertiary)`
- Use a `border-radius` other than `rounded.pill`, `rounded.lg`, `rounded.md`
- Use `font-size` smaller than 11px or larger than 15px (exception: numeric displays, e.g. temperature)
- Nest more than 2 levels of cards
- Apply color directly to text unless it's a semantic state (success, info, tertiary)

**Always:**

- Resolve every color through a CSS variable token — dark mode must "just work"
- Sentence case for all user-facing text
- Use the named spacing scale for padding/gaps — never arbitrary values
- Section labels: `text-label font-medium uppercase tracking-widest text-text-tertiary`
- Selected/active state: `border-2 border-border-focus` — nothing else

## Motion

Two mount-transition keyframes exist today — `fadeIn` (opacity 0→1, `0.3s ease-in-out`) and `slideUp` (translateY 10px→0 + opacity 0→1, `0.3s ease-out`). There is no broader easing/duration philosophy beyond these two yet; treat this as the current honest scope rather than an invented system.
