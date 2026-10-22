# Review checklist — Trello-lite API

Derived from `nestjs-ai-training/CLAUDE.md`. Suggested severity in brackets;
use judgment when the real impact is higher or lower.

## Correctness & scope
- [must] Behaviour traces to a `Confirmed`/`Designed` item in `docs/requirements.md` (or the ticket); nothing built on `Assumption`/`Open` items or invented business rules.
- [must] Status codes and request/response shapes match `docs/source/trello-lite-api-design.md`; where the design is silent, a question exists instead of a silent choice.
- [must] No edits to `docs/source/`; no status changes on `Confirmed` items or the verbatim Q&A (`docs/requirements.md` §7).
- [should] No unrelated refactors mixed into the change.
- [should] Docs updated when behaviour changed (`docs/architecture.md`, requirement status, ticket in `docs/tickets/`).

## Security
- [must] Every non-public endpoint uses `JwtAuthGuard`.
- [must] Authorization (ownership / board membership / Admin role) is checked on every resource access, not just authentication.
- [must] No passwords, hashes, tokens or secrets returned or logged; entities mapped to public shapes (`toPublicUser`-style), never raw Prisma models.
- [must] Secrets only from env vars; no fallback default `JWT_SECRET`; no real credentials in `app.module.ts`; `.env` not committed.
- [must] No string-built SQL; Prisma APIs / parameterized queries only.
- [must] DTOs never accept server-controlled fields (ids, roles, timestamps).

## API & errors
- [should] Errors thrown as Nest `HttpException`s; no hand-built error bodies — `ApiExceptionFilter` produces `{ errors: { code, message, details? } }`.
- [should] Body, query and params validated by `class-validator` DTOs so field errors become `VALIDATION_FAILED` (D-14).
- [should] Prisma errors mapped in services (e.g. `P2002` → 409), not leaking as 500s.
- [should] App-level setup lives in `configureApp()` or `AppModule`, not only in `main.ts`.

## Conventions
- [should] Relative imports end in `.js` (ESM).
- [nit] `import type` for type-only imports.
- [should] Feature layout: `src/<feature>/<feature>.module.ts|controller.ts|service.ts` + `dto/`.
- [should] No floating promises.
- [should] New env vars documented in `.env.example`.

## Tests
- [must] No existing test deleted, skipped (`.skip`, `xit`) or weakened.
- [should] New endpoints have e2e coverage: happy path, validation errors, 401 unauthenticated, 403/404 for another user's resources.
- [should] Services with logic have unit tests incl. edge cases and error paths; bug fixes come with a reproducing test.
- [should] Unit tests stay database-free (fakes such as `test/fakes/in-memory-users.service.ts`); no `jest.fn()`/`jest.spyOn()` (unavailable in ESM mode).
- [should] E2E tests call `configureApp(app)` before `init()` and `resetDatabase()` when writing data; tests are deterministic and order-independent.

## Changes that require prior approval
Flag as **must fix** (or ask the author to confirm approval) if the diff contains any of these without evidence of approval in the ticket/commits:
- Added, removed or upgraded dependencies (`package.json`, `pnpm-lock.yaml`).
- Prisma schema or migration changes, or models differing from `docs/architecture.md` §3.2.1 / D-15, D-19, D-20.
- Auth/authorization behaviour or token format changes.
- Changes to an existing public API contract (routes, shapes, status codes).
- Build, lint, test or TypeScript config changes.
- Large refactors, moved/renamed modules, deleted files.
