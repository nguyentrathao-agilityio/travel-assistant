# TL-006: Board management

- **Status:** In review
- **Requirements:** FR-BOARD-01 … 09, DES-BOARD-01 … 03, D-01, D-10, D-20, D-21 … D-24
- **Blocking questions:** none (Q-09, Q-31, Q-39 and the boards part of Q-28 answered 2026-10-15: D-21 … D-24)
- **Assumptions relied on:** none
- **Owner:** _TBD_
- **Depends on:** TL-002, TL-003, TL-004

## Goal

Admins create, update, view and archive boards; Members view the boards they
belong to; everyone can search and page through their visible boards.

## Scope

**In scope**

- `Board` and `BoardMember` models + migration.
- Shared `{ meta, data }` response type and pagination query DTO
  (`page`, `limit`; moved from TL-002).
- Endpoints below, with Admin-only actions guarded by `RolesGuard` and
  membership checks in the service.

**Out of scope**

- Adding members (only via invitations, TL-007).
- Cancelling pending invitations on archive — added in TL-007 once
  invitations exist.
- Restore (Q-03).

## Acceptance criteria

- [x] AC-BOARD-01 … AC-BOARD-10 (`docs/requirements.md` §4.5) pass.
- [x] `POST`/`PATCH /boards` never return 409 for duplicate names (D-10).
- [x] Unknown fields in update bodies cannot change anything but name and description.
- [x] Search is "contains", case-insensitive (D-21).
- [x] Archived boards are hidden from everyone; `/boards/:id` on one → 404 (D-22).
- [x] `limit` 1–100, `page` ≥ 1; out of range → 400 `VALIDATION_FAILED` (D-23).
- [x] Unknown/archived board → 404; Member not in the board → 403 (D-24).

## API changes

| Method | Route                | Auth   | Request                    | Response / status codes |
| ------ | -------------------- | ------ | -------------------------- | ----------------------- |
| GET    | `/api/v1/boards`     | JWT    | `?search&page&limit`       | 200 `{ meta, data }`; 400; 401 |
| GET    | `/api/v1/boards/:id` | JWT    | —                          | 200 `{ data }`; 400; 401; 403; 404 |
| POST   | `/api/v1/boards`     | Admin  | `{ name, description? }`   | 201 `{ data }`; 400; 401; 403 |
| PATCH  | `/api/v1/boards/:id` | Admin  | `{ name?, description? }`  | 200 `{ data }`; 400; 401; 403; 404 |
| DELETE | `/api/v1/boards/:id` | Admin  | —                          | 204; 400; 401; 403; 404 |

## Data / schema changes

`boards`, `board_members` per DB design and `docs/architecture.md` §3.2.1.
**Requires approval.**

## Assumptions

None.

## Security considerations

- Members must never see boards they don't belong to, including via search.
- Archived boards excluded from Member reads.

## Test plan

- **Unit:** `BoardsService` visibility rules, search, pagination, archive.
- **E2E:** each AC; 401; Member vs Admin; 404 for unknown id; 400 for malformed id (ADR-008).

## Workflow checklist

- [x] Read: requirements, questions, architecture, affected code
- [x] Plan: written and approved (schema) — 2026-10-15
- [x] Test: tests written and failing for the right reason
- [x] Implement
- [x] Verify: `pnpm lint`, `pnpm test`, `pnpm test:e2e`, `pnpm build` pass
- [x] Review: diff self-reviewed; docs and ticket status updated

## Notes

- 2026-10-15: product owner answered Q-09, Q-31, Q-39 and the boards part of
  Q-28 (D-21 … D-24).
- `name` is trimmed; a blank name is rejected. The DB design sets no length
  limit, so none is enforced. `description` may be sent as `null` on PATCH to
  clear it (column is nullable).
- 400 (malformed id / invalid query) and 401 were added to the endpoint table:
  they follow from ADR-008, D-23 and `JwtAuthGuard`.
- Archiving does not yet cancel invitations (TL-007).
