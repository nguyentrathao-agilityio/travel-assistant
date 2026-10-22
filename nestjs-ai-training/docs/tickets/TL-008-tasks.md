# TL-008: Task management

- **Status:** Draft
- **Requirements:** FR-TASK-01 … 05, FR-TASK-10 … 12, FR-TASK-20 … 26, DES-TASK-01 … 04, D-08, D-11, D-13
- **Blocking questions:** Q-37 (status/assignee rules at creation), Q-38 (status transitions), Q-05 (self-assign, unassign), Q-29 (`boardId` required?), Q-30 (allowed `sortBy`), Q-12 (date range bounds/timezone), Q-28 (status codes), Q-04 (tasks of archived boards)
- **Assumptions relied on:** none
- **Owner:** _TBD_
- **Depends on:** TL-006 (TL-007 for members joining boards)

## Goal

Board members and Admins manage tasks: create, view, filter, page, update
(including status and assignee with the confirmed restrictions); Admins
archive tasks.

## Scope

**In scope**

- `Task` model + `TaskStatus` enum + migration.
- Endpoints below with permission rules FR-TASK-20 … 26 and D-13.

**Out of scope**

- Restore (Q-03); custom statuses (FR-TASK-03).

## Acceptance criteria

- [ ] AC-TASK-01 … AC-TASK-14 (`docs/requirements.md` §4.5) pass.

## API changes

| Method | Route                     | Auth                 | Request | Response / status codes |
| ------ | ------------------------- | -------------------- | ------- | ----------------------- |
| GET    | `/api/v1/tasks`           | Board member, Admin  | `?boardId&assigneeId&status&startDate&endDate&page&limit&sortBy&order` | 200 `{ meta, data }`; 403 |
| POST   | `/api/v1/tasks`           | Board member, Admin  | `{ boardId, title, description?, assigneeId?, status?, dueDate? }` | 201 `{ data }`; 400 |
| GET    | `/api/v1/tasks/:taskId`   | Board member, Admin  | — | 200 `{ data }`; 404 |
| PATCH  | `/api/v1/tasks/:taskId`   | Board member, Admin  | `{ title?, description?, status?, assigneeId?, dueDate? }` | 200 `{ data }`; 403; 404 |
| DELETE | `/api/v1/tasks/:id`       | Admin                | — | 204; 403; 404 |

## Data / schema changes

`tasks` per DB design (`dueDate` datetime, D-11) and `docs/architecture.md` §3.2.1.
**Requires approval.**

## Assumptions

None.

## Security considerations

- Every task access checks board membership (Admins excepted, D-01/DES-BOARD-01).
- A Member may only assign to members of the same board (FR-TASK-25).

## Test plan

- **Unit:** permission matrix (status only by assignee; assign within board;
  delete Admin-only); filters; pagination; default status.
- **E2E:** each AC; non-member access; archived tasks excluded.

## Workflow checklist

- [ ] Read: requirements, questions, architecture, affected code
- [ ] Plan: written and approved (schema)
- [ ] Test: tests written and failing for the right reason
- [ ] Implement
- [ ] Verify: `pnpm lint`, `pnpm test`, `pnpm test:e2e`, `pnpm build` pass
- [ ] Review: diff self-reviewed; docs and ticket status updated

## Notes

_TBD_
