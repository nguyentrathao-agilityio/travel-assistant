# 🐛 Frontend AI Skill — Fix Bugs Guide

> **Use this when:** diagnosing, debugging, or patching existing code.
> **Also read:** `SHARED.md` — all shared rules apply here too.

---

## ⚙️ Workflow Before Touching Any Code

1. **Read the failing code fully** — understand what it does before suggesting a fix.
2. **Identify the root cause** — do not patch symptoms.
3. **Confirm scope** — only change what is necessary to fix the bug. Do not refactor unrelated code.
4. **Explain the fix** — state what was wrong and why the change fixes it.
5. **Self-review** the fix against `REVIEW.md` checklist before responding.

---

## 🔍 Diagnosis First — Always

Before writing any code, answer these:

- What is the **observed behavior**?
- What is the **expected behavior**?
- What is the **root cause** (wrong state shape, race condition, missing dependency, incorrect type, etc.)?
- Is there anything **unknown** that requires runtime info (logs, network response, env config)?

If the root cause is unknown → say so explicitly before attempting a fix.

---

## ✅ When You Can Fix a Bug

State clearly:

1. **What was wrong** — specific, technical reason
2. **What the fix does** — why it resolves the root cause
3. **What was not changed** — confirm no unrelated code was touched

```typescript
// Before — bug: authToken read before async initialization completes
useEffect(() => {
  fetchData(authToken); // authToken is undefined on first render
}, []);

// After — fix: depend on authToken so effect re-runs when it's available
useEffect(() => {
  if (!authToken) return;
  fetchData(authToken);
}, [authToken]);
```

---

## ❌ When You Cannot Fix a Bug

If the bug **cannot be resolved with confidence**, do not guess, patch blindly, or silently change unrelated code.

### Required response:

```
I cannot fix this bug confidently.

What I know: [exact technical description of what is understood]

What I don't know: [what runtime context, logs, or config is missing]

Suggested next step: [specific action — add a console.log here, share the network tab response, etc.]
```

### Example:

```
I cannot fix this bug confidently.

What I know: useCopilotAction's render function receives status="failed" but the
error prop is undefined, so the ErrorCard renders with no message.

What I don't know: whether the Mastra tool is throwing a string or an Error object —
the CopilotKit version in use may serialize the error differently.

Suggested next step: console.log the full error prop inside the render function
and share the output, or check the CopilotKit version in package.json.
```

### What to never do:

```
❌ Silently change unrelated code hoping it fixes the issue
❌ Say "this should work now" without understanding why it was broken
❌ Guess at the cause without disclosing uncertainty
❌ Rewrite a large block to "avoid" the bug rather than fix it
❌ Claim the fix is complete when the root cause is still unknown
```

---

## 🧩 Common Bug Patterns & Fixes

### 1. Stale closure in useEffect

```typescript
// ❌ Bug: reading stale `count` value
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000);
  return () => clearInterval(id);
}, []); // missing dependency

// ✅ Fix: add count to deps, or use functional update
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000);
  return () => clearInterval(id);
}, [count]);
```

### 2. Missing Zod validation causing runtime crash

```typescript
// ❌ Bug: assumes API always returns the right shape
const data = await res.json();
setFlight(data.flight); // crash if data.flight is undefined

// ✅ Fix: validate with Zod before using
const parsed = FlightSchema.safeParse(await res.json());
if (!parsed.success) throw new Error('Invalid flight data shape');
setFlight(parsed.data);
```

### 3. Inline function breaks memo

```tsx
// ❌ Bug: new function ref on every render → memo child re-renders anyway
<FlightCard onSelect={(id) => setSelected(id)} />;

// ✅ Fix: stable ref with useCallback
const handleSelect = useCallback((id: string) => setSelected(id), []);
<FlightCard onSelect={handleSelect} />;
```

### 4. cn() not used — class conflict

```tsx
// ❌ Bug: both border classes apply, last one wins unexpectedly
<div className={`border ${isSelected ? 'border-2 border-border-focus' : 'border-border-secondary'}`} />

// ✅ Fix: cn() resolves Tailwind conflicts correctly
<div className={cn('border', isSelected ? 'border-2 border-border-focus' : 'border-border-secondary')} />
```

### 5. CopilotKit generative component crashes on undefined data

```tsx
// ❌ Bug: result is undefined during inProgress, component crashes
const WeatherCard = ({ data }: { data: WeatherData }) => (
  <div>{data.temperature}</div> // TypeError if data is undefined
);

// ✅ Fix: guard at component level — CopilotKit layer handles the loading state
const WeatherCard = ({ data }: { data?: WeatherData }) => {
  if (!data) return null;
  return <div>{data.temperature}</div>;
};
```

### 6. Mastra tool swallowing errors silently

```typescript
// ❌ Bug: failed fetch returns no error, action gets empty result
execute: async ({ context }) => {
  const res = await fetch('/api/data');
  const data = await res.json(); // no check on res.ok
  return data;
};

// ✅ Fix: always check res.ok before parsing
execute: async ({ context }) => {
  const res = await fetch('/api/data');
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  const raw = await res.json();
  const parsed = DataSchema.safeParse(raw);
  if (!parsed.success) throw new Error('Invalid response shape');
  return parsed.data;
};
```

### 7. Barrel import breaking tree-shaking / causing circular deps

```typescript
// ❌ Circular: components/common/index.ts imports Button,
//    Button imports from components/common/index.ts
import { cn } from '@/components/common'; // wrong — cn is in utils

// ✅ Fix: import from correct barrel
import { cn } from '@/utils';
import { Button } from '@/components/common';
```

---

## 🔬 Minimum Change Principle

> Fix only the broken thing. Do not improve, refactor, or "clean up" nearby code unless it is directly causing the bug.

```
✅ Change one line that fixes the root cause
✅ Add a missing dependency to a useEffect
✅ Add a null check before accessing a property

❌ Refactor the entire component while "fixing" a typo
❌ Change variable names or file structure during a bug fix
❌ Add features or improvements not related to the bug
```

If you notice other issues while fixing a bug — **report them separately** after the fix, don't fix them silently.
