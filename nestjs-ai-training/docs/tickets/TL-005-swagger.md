# TL-005: Swagger API documentation

- **Status:** In review
- **Requirements:** NFR-03
- **Blocking questions:** none
- **Assumptions relied on:** A-003 — docs served at `/api/docs` (acknowledged 2026-10-14)
- **Owner:** _TBD_
- **Depends on:** TL-002 (prefix and envelopes); update again after each feature ticket

## Goal

Provide detailed, browsable API documentation as the training target requires.

## Scope

**In scope**

- `@nestjs/swagger` setup with Bearer auth scheme.
- DTO and response schema decorators for existing endpoints, including the
  `{ data }`, `{ meta, data }` and `{ errors }` shapes.

**Out of scope**

- Documenting endpoints that do not exist yet (each feature ticket adds its own).

## Acceptance criteria

- [x] Given the app is running, when opening the docs route, then every
      implemented endpoint is listed with request/response schemas and status codes.
- [x] Given a token entered in the UI, then authenticated endpoints can be called.

## API changes

| Method | Route       | Auth | Request | Response / status codes |
| ------ | ----------- | ---- | ------- | ----------------------- |
| GET    | `/api/docs` | No   | —       | Swagger UI (A-003) |
| GET    | `/api/docs/json` | No | —     | OpenAPI document (A-003) |

## Data / schema changes

None.

## Assumptions

- A-003: docs route `/api/docs` — acknowledged by the user 2026-10-14.

## Security considerations

- Decided: disabled when `NODE_ENV=production` unless `SWAGGER_ENABLED=true`
  (any other value counts as `false`); when disabled, `/api/docs` returns the
  enveloped 404.

## Test plan

- **E2E:** docs route returns 200; OpenAPI JSON contains the implemented paths.

## Workflow checklist

- [x] Read: requirements, questions, architecture, affected code
- [x] Plan: written and approved (new dependency)
- [x] Test: tests written and failing for the right reason
- [x] Implement
- [x] Verify: `pnpm lint`, `pnpm test`, `pnpm test:e2e`, `pnpm build` pass
- [x] Review: diff self-reviewed; docs and ticket status updated

## Notes

- `configureApp()` returns 404 for every path outside `/api/v1`
  (TL-002). Serve the docs under the prefix or add the docs route to that
  allow-list.

Plan: `docs/superpowers/plans/2026-10-14-tl-005-swagger.md`. Decisions
approved 2026-10-14: route `/api/docs` (JSON `/api/docs/json`), production
switch as above, dependency `@nestjs/swagger` 12.0.2. `@scarf/scarf`
(telemetry pulled in by `@nestjs/swagger`) is denied its build script in
`pnpm-workspace.yaml`. No real authenticated endpoint exists yet, so the
Bearer scheme is checked on the test-only guarded routes.
