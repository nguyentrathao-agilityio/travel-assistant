# TL-001: Migrate tests from Vitest to Jest

- **Status:** Done
- **Requirements:** D-04, DEV-001, NFR-02 (ADR-009)
- **Blocking questions:** none
- **Assumptions relied on:** none
- **Owner:** _TBD_
- **Depends on:** none — do this first so every later ticket writes Jest tests

## Goal

Replace Vitest with Jest, as the tech stack requires (D-04), while the test
suite is still small.

## Scope

**In scope**

- Install Jest and a TypeScript transform that works with this ESM project
  (`"type": "module"`, NodeNext, decorators + `emitDecoratorMetadata`).
- Jest configs for unit (`**/*.spec.ts`) and e2e (`**/*.e2e-spec.ts`);
  e2e config sets the test-only `JWT_SECRET`.
- Update `package.json` scripts: `test`, `test:watch`, `test:cov`,
  `test:debug`, `test:e2e`.
- Update `tsconfig.json` `types` (`vitest/globals` → `jest`).
- Remove Vitest packages and configs.
- Update `CLAUDE.md` and `docs/architecture.md` §4.

**Out of scope**

- New tests or behaviour changes.

## Acceptance criteria

- [x] Given the existing suites, when `pnpm test` runs, then all current unit
      tests pass under Jest (same test count as before: 9).
- [x] When `pnpm test:e2e` runs, then all current e2e tests pass (15).
- [x] `pnpm test:cov` produces a coverage report.
- [x] No `vitest` packages, configs or imports remain.
- [x] `pnpm lint` and `pnpm build` pass.

## API changes

None.

## Data / schema changes

None.

## Assumptions

None.

## Security considerations

- Test-only secrets stay in test config, never in `.env.example` defaults.

## Test plan

- **Unit / E2E:** the existing suites are the regression check.

## Workflow checklist

- [x] Read: requirements, questions, architecture, affected code
- [x] Plan: written and approved (dependency + test config change)
- [x] Test: n/a (migration of existing tests)
- [x] Implement
- [x] Verify: `pnpm lint`, `pnpm test`, `pnpm test:e2e`, `pnpm build` pass
- [x] Review: diff self-reviewed; docs and ticket status updated

## Notes

- Main risk: Jest + native ESM + decorators. Options to evaluate in the plan:
  `ts-jest` ESM preset with `--experimental-vm-modules`, or `@swc/jest`.
  Pick the one that runs the current suites unchanged.

## Result (2026-10-13)

- `jest` 30.5.2, `ts-jest` 29.4.14, `@types/jest` 30.0.0 added; `vitest`,
  `@vitest/coverage-v8`, `vite` removed.
- Native ESM: `ts-jest` with `useESM` worked; the `@swc/jest` fallback was not needed.
- Verified: `pnpm test` 9/9, `pnpm test:e2e` 15/15, `pnpm test:cov` report,
  `pnpm lint`, `pnpm build`, `tsc --noEmit` all pass.
- `pnpm-workspace.yaml`: build scripts of `@parcel/watcher` and `unrs-resolver`
  set to not run (`allowBuilds: false`); tests pass without them.
