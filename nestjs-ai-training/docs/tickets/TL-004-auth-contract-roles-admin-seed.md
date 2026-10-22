# TL-004: Auth contract, roles guard, Admin seed

- **Status:** Done
- **Requirements:** FR-AUTH-01 … 03, FR-ROLE-01/02, D-02, D-08, D-12, D-17, D-18, DES-AUTH-01/02, DEV-002, DEV-007 (ADR-010)
- **Blocking questions:** none (decided: D-17, D-18)
- **Assumptions relied on:** none
- **Owner:** _TBD_
- **Depends on:** TL-002, TL-003

## Goal

Make authentication match the API design and enable role-based access
control for the feature tickets.

## Scope

**In scope**

- `POST /api/v1/auth/register` → **201** `{ data: User, access: "<token>" }`.
- `POST /api/v1/auth/login` → **200** `{ data: User, access: "<token>" }`.
- User object: `id, username, email, role, createdAt, updatedAt`.
- `@Roles()` decorator + `RolesGuard` (`ADMIN`, `MEMBER`).
- Remove `GET /` and `GET /auth/me` with their tests (D-18).
- Access token: 1 hour, claims `{ sub, email, role }` (D-17).
- Shared `{ data }` response type (moved from TL-002).
- Seed script creating an Admin from environment variables (documented in
  `.env.example`); idempotent.

**Out of scope**

- Board-level membership checks (TL-006).

## Acceptance criteria

- [x] AC-AUTH-01 … AC-AUTH-07 (`docs/requirements.md` §4.5) pass.
- [x] Given a `MEMBER` token on an `ADMIN`-only test route, then **403**
      `FORBIDDEN`; given an `ADMIN` token, then allowed.
- [x] Given the seed runs twice, then exactly one Admin exists.
- [x] Responses never include the password hash.

## API changes

| Method | Route                   | Auth | Request                       | Response / status codes |
| ------ | ----------------------- | ---- | ----------------------------- | ----------------------- |
| POST   | `/api/v1/auth/register` | No   | `{ username, email, password }` | 201 `{ data, access }`; 400; 409 |
| POST   | `/api/v1/auth/login`    | No   | `{ email, password }`         | 200 `{ data, access }`; 401 |

## Data / schema changes

None beyond TL-003.

## Assumptions

None.

## Security considerations

- Admin seed credentials only from environment variables; no defaults.
- `role` in request bodies is ignored (whitelist).

## Test plan

- **Unit:** `AuthService` (register/login responses), `RolesGuard`.
- **E2E:** register/login shapes and codes; role-guarded route; seed.

## Workflow checklist

- [x] Read: requirements, questions, architecture, affected code
- [x] Plan: written and approved (changes existing auth contract)
- [x] Test: tests written and failing for the right reason
- [x] Implement
- [x] Verify: `pnpm lint`, `pnpm test`, `pnpm test:e2e`, `pnpm build` pass
- [x] Review: diff self-reviewed; docs and ticket status updated

## Notes

Plan: `docs/superpowers/plans/2026-10-14-tl-004-auth-roles-admin-seed.md`.
Decisions approved with the plan (2026-10-14):

1. The seed fails if `ADMIN_EMAIL` belongs to an existing non-admin user
   (no promotion). If it already belongs to an Admin, the seed is a no-op
   and does not reset the password.
2. `pnpm db:seed` = `nest build && node --env-file-if-exists=.env dist/seed/main.js`.
3. `CreateUserInput.role?` is server-side only; `RegisterDto` is unchanged.
4. AC-AUTH-06 and the 403 criterion are tested via the test-only
   `test/fixtures/protected.controller.ts`, since no real authenticated
   endpoint exists after removing `GET /auth/me`.
5. Removed `src/app.controller.ts`, `src/app.controller.spec.ts`,
   `src/app.service.ts`, `test/app.e2e-spec.ts` (D-18).
