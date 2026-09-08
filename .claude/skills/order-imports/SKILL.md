---
name: order-imports
description: Use when writing or editing import statements in apps/web or apps/mobile source files.
---

# Order Imports

## Overview

External/framework packages (`react`, `react-native`, `zod`, `lucide-react`, ...) are ungrouped at
the top with no comment. Everything else is grouped by purpose under a one-line comment header, in
this order: **Services, Constants, Schemas, Components, Hooks, Context, Stores, Utils, Types**.
`apps/web` uses `Context` (React context); `apps/mobile` uses `Stores` (Zustand) instead — use
whichever exists in the file, skip the rest.

Omit a category's comment entirely when the file has no imports in it — never add an empty header.

## Example

```typescript
import { StyleSheet, View } from 'react-native';

// Types
import type { DestinationExplorerResult } from '@repo/schemas';

// Utils
import { shellColors, shellSpacing } from '../theme';

// Components
import { Card, Typography } from './common';
import { TripPlacesSection } from './TripPlacesSection';
import { TripTipsSection } from './TripTipsSection';
```

`apps/web` reference (uses the `@/*` alias and adds `Context`): see the "📦 Import Order" section
in `.claude/docs/shared.md` for the full worked example.

## Common mistakes

- Adding a category comment above a single leftover import instead of merging it into the nearest
  applicable group.
- Grouping external packages under a comment (e.g. `// Libraries`) — they stay uncommented at top.
- Reordering an existing import block for an unrelated edit — only reorder what you're already
  touching.
