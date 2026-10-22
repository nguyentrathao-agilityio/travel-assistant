# TL-002: `/api/v1` prefix, response and error envelopes

- **Status:** Done
- **Requirements:** D-03, D-09, D-14, DES-API-01 … 05, DEV-006, DEV-008 (ADR-005, ADR-006)
- **Blocking questions:** none (C-05 decided: D-14)
- **Assumptions relied on:** none
- **Owner:** _TBD_
- **Depends on:** TL-001

## Goal

Apply the documented API conventions once, globally, so every feature ticket
inherits them.

## Scope

**In scope**

- Global prefix `/api/v1`, applied the same way in `main.ts` and in e2e test
  apps (shared app-configuration function).
- Global exception filter producing `{ "errors": { code, message, details? } }`
  for every error, including validation errors from `ValidationPipe`
  (`details: [{ field, description }]`) and unknown routes.
- ~~Shared response types and pagination query DTO~~ — moved to TL-004
  (`{ data }`) and TL-006 (`{ meta, data }`, pagination DTO) by plan approval;
  no global response interceptor (ADR-006).

**Out of scope**

- Changing the auth response bodies (TL-004).
- Removing `GET /` and `GET /auth/me` (TL-004, D-18).

## Acceptance criteria

- [x] Given any existing route, when called under `/api/v1`, then it responds;
      without the prefix it returns 404.
- [x] Given an invalid request body, when validated, then **400** with
      `errors.code = "VALIDATION_FAILED"`, `errors.message` and `errors.details[]` (D-14).
- [x] Given malformed JSON, then **400** `errors.code = "BAD_REQUEST"` (D-14).
- [x] Given a missing/invalid token, then **401** `{ errors: { code: "UNAUTHORIZED", … } }`.
- [x] Given an unknown route, then **404** `{ errors: { code: "NOT_FOUND", … } }`.
- [x] Given an unexpected exception, then **500** `INTERNAL_SERVER_ERROR` with
      no stack trace or internal message in the body.

## API changes

| Method | Route | Auth | Request | Response / status codes |
| ------ | ----- | ---- | ------- | ----------------------- |
| all    | `/…` → `/api/v1/…` | unchanged | unchanged | error bodies use the envelope |

## Data / schema changes

None.

## Assumptions

None.

## Security considerations

- 500 responses must not leak stack traces or exception messages.

## Test plan

- **Unit:** exception filter mapping for each HTTP status; validation details.
- **E2E:** prefix applied; 400/401/404/500 envelope shapes.

## Workflow checklist

- [x] Read: requirements, questions, architecture, affected code
- [x] Plan: written and approved (changes existing API contract)
- [x] Test: tests written and failing for the right reason
- [x] Implement
- [x] Verify: `pnpm lint`, `pnpm test`, `pnpm test:e2e`, `pnpm build` pass
- [x] Review: diff self-reviewed; docs and ticket status updated

## Notes

- `409 CONFLICT` and `403 FORBIDDEN` codes are defined here, used by later tickets.

## Result (2026-10-13)

- Added `src/configure-app.ts` (prefix + 404 envelope for paths outside the
  prefix), `src/common/http/` (`ApiExceptionFilter`, `ValidationFailedException`,
  `validationExceptionFactory`), wired in `AppModule` and `main.ts`.
- Found during testing: with a global prefix, Nest only handles unknown routes
  under `/api/v1`; other paths got Express's HTML 404. Fixed with a middleware
  in `configureApp()` (covered by e2e).
- Existing e2e tests changed only their paths to `/api/v1/…`; no assertion removed.
- Verified: `pnpm test` 26/26, `pnpm test:e2e` 22/22, `pnpm lint`, `pnpm build`,
  `tsc --noEmit`, Prettier all pass.
