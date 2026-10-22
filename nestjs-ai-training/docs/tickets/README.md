# Tickets

One Markdown file per unit of work.

## Naming

`TL-<3-digit number>-<short-kebab-name>.md`, e.g. `TL-001-board-crud.md`.
Numbers are sequential and never reused.

## Lifecycle

`Draft` → `Ready` → `In progress` → `In review` → `Done`
(or `Blocked` / `Cancelled`)

- **Draft:** being written; may reference unconfirmed requirements.
- **Ready:** every linked requirement is `Confirmed`, blocking open questions
  are answered, relied-on assumptions are acknowledged, acceptance criteria
  are testable.
- **In progress / In review / Done:** follow the workflow in `CLAUDE.md`
  (Read → Plan → Test → Implement → Verify → Review).

A ticket must not move to `In progress` while it depends on an `Open`
question or an unacknowledged assumption (see `docs/requirements.md`).

## Creating a ticket

Copy [`_template.md`](./_template.md) and fill in every section.

## Index

Listed in implementation order.

| Ticket | Title | Status | Requirements | Depends on | Blocking questions |
| ------ | ----- | ------ | ------------ | ---------- | ------------------ |
| [TL-001](./TL-001-migrate-tests-to-jest.md) | Migrate tests from Vitest to Jest | Done | D-04, DEV-001 | — | none |
| [TL-002](./TL-002-api-prefix-and-envelopes.md) | `/api/v1` prefix, response and error envelopes | Done | D-03, D-09, DES-API-01…05 | TL-001 | none |
| [TL-003](./TL-003-postgres-prisma-users.md) | PostgreSQL + Prisma, `User` model, bcrypt | Done | NFR-04, D-05, D-08 | TL-001 | none |
| [TL-004](./TL-004-auth-contract-roles-admin-seed.md) | Auth contract, roles guard, Admin seed | Done | FR-AUTH-01…03, D-02, D-12 | TL-002, TL-003 | none |
| [TL-005](./TL-005-swagger.md) | Swagger API documentation | In review | NFR-03 | TL-002 | none (A-003 acknowledged) |
| [TL-006](./TL-006-boards.md) | Board management | In review | FR-BOARD-01…09 | TL-002…004 | none (D-21…D-24) |
| [TL-007](./TL-007-invitations.md) | Board invitations | Draft | FR-INV-01…08 | TL-006 | Q-07, Q-18, Q-19, Q-20, Q-34; A-002 |
| [TL-008](./TL-008-tasks.md) | Task management | Draft | FR-TASK-01…26 | TL-006 | Q-04, Q-05, Q-12, Q-28…Q-30, Q-37, Q-38 |
