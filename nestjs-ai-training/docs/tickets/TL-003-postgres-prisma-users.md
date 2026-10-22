# TL-003: PostgreSQL + Prisma, `User` model, bcrypt

- **Status:** Done
- **Requirements:** NFR-04, D-05, D-08, D-15, D-16, DES-USER-01, DEV-003, DEV-005, DEV-009, DEV-011 (ADR-001, ADR-007, ADR-008)
- **Blocking questions:** none (decided: D-15, D-16)
- **Assumptions relied on:** none
- **Owner:** _TBD_
- **Depends on:** TL-001

## Goal

Replace the in-memory user store with PostgreSQL via Prisma, and hash
passwords with bcrypt as designed.

## Scope

**In scope**

- Local PostgreSQL via Docker Compose; `DATABASE_URL` in `.env.example`.
- Prisma setup, `PrismaService` / `PrismaModule`.
- `User` model and `Role` enum (`ADMIN`, `MEMBER`) only — other models come
  with their feature tickets. First migration.
- `UsersService` reads/writes through Prisma; `updatedAt` added.
- `PasswordHasherService` switched to bcrypt.
- E2E test database strategy (separate database, reset between tests).

**Out of scope**

- Board, invitation and task models (TL-006 … TL-008).
- Auth response changes and Admin seed (TL-004).

## Acceptance criteria

- [x] Given a registered user, when the app restarts, then the user can still log in.
- [x] Given a registration, then the stored password is a bcrypt hash (`$2…`),
      never the plain password.
- [x] Given a duplicate username or email, then **409** (DB unique constraint);
      emails differing only in case count as duplicates, usernames do not (D-16).
- [x] New users are stored with role `MEMBER` (D-08 code).
- [x] E2E tests run against an isolated test database and do not depend on order.

## API changes

None (response shape changes are TL-004).

## Data / schema changes

`users` table per DB §users and the sketch in `docs/architecture.md` §3.2.1.
**Requires approval before creating the schema and migration.**

## Assumptions

None.

## Security considerations

- `DATABASE_URL` only from environment; never committed.
- bcrypt cost factor chosen in the plan (and documented).

## Test plan

- **Unit:** `PasswordHasherService` (hash/verify, wrong password);
  `UsersService` with a test database or mocked Prisma client.
- **E2E:** register → restart-equivalent (new app instance) → login.

## Workflow checklist

- [x] Read: requirements, questions, architecture, affected code
- [x] Plan: written and approved (dependencies + schema)
- [x] Test: tests written and failing for the right reason
- [x] Implement
- [x] Verify: `pnpm lint`, `pnpm test`, `pnpm test:e2e`, `pnpm build` pass
- [x] Review: diff self-reviewed; docs and ticket status updated

## Notes

- No existing hashes to migrate (in-memory store), see DEV-005.

## Result (2026-10-13)

- Packages: `prisma` (dev), `@prisma/client`, `@prisma/adapter-pg` 7.10.0
  (stable; npm `latest` points at an 8.0 release candidate), `bcryptjs` 3.0.3
  instead of native `bcrypt` (same algorithm, no native build). pnpm allows the
  `@prisma/engines` install script (downloads the migration engine).
- Schema: `User` + `Role { ADMIN MEMBER }`, table `users`, column `password`;
  migration `init_users`.
- `UsersService` on Prisma (async); P2002 → 409. Role responses are now
  `"MEMBER"` (D-08); usernames are case-sensitive (D-16); users have `updatedAt`.
- Local databases: an existing `trello_lite` database (another project, with
  data) was found and left untouched; this project uses `nestjs_ai_training`
  and `nestjs_ai_training_test`.
- Optional `docker-compose.yml` (port 5433) for teammates.
- Verified: `pnpm test` 37/37, `pnpm test:e2e` 27/27, `pnpm lint`,
  `pnpm build`, `tsc --noEmit`, Prettier, fresh `pnpm install` generates the
  client, and a manual register/login against the dev database.
