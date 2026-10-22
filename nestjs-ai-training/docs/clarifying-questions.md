# Clarifying questions — Trello-lite

> Single register of questions for the product owner. Sources are in
> `docs/source/` (read-only); requirement IDs refer to
> [`requirements.md`](./requirements.md).
>
> Questions are answered by the product owner or, where the sources are
> silent or contradict each other, by a recorded team decision
> (`requirements.md` §11). When an answer arrives, record it here, update
> the related requirement, and add a change-log entry in `requirements.md`.
> Resolved items are never reopened.

## Status legend

| Status     | Meaning                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| `Resolved` | Answered by the client's Q&A, by the binding design docs (D-01), or by a team decision (D-xx).       |
| `Partial`  | Partly answered; the open remainder is stated.                                                       |
| `Open`     | Not answered by any source.                                                                          |

## 1. Resolved — original Q&A

Full wording in `requirements.md` §7 and
[`source/nodejs-practice-original.md`](./source/nodejs-practice-original.md).

| Ref    | Topic                                   | Client answer                                                       | Requirement          |
| ------ | --------------------------------------- | ------------------------------------------------------------------- | -------------------- |
| Q&A 1  | Login identifier                        | Email + password                                                    | FR-AUTH-02           |
| Q&A 2  | Default role on registration            | Member                                                              | FR-ROLE-02           |
| Q&A 3  | Board creation fields                   | Name and description                                                | FR-BOARD-01          |
| Q&A 4  | Board view fields                       | Name and description                                                | FR-BOARD-06          |
| Q&A 5  | Updatable board fields                  | Name and description only                                           | FR-BOARD-02          |
| Q&A 6  | Board search/list                       | Search by name; 10 per page; creation date descending               | FR-BOARD-07…09       |
| Q&A 7  | Board deletion                          | Archive (soft delete)                                               | FR-BOARD-03          |
| Q&A 8  | Invitation channel                      | Email                                                               | FR-INV-04            |
| Q&A 9  | Email provider preference               | No preference; SendGrid suggested by BA (not confirmed)            | A-002                |
| Q&A 10 | Invitation link, with/without account   | With account → board; without → sign-up → board                     | FR-INV-06            |
| Q&A 11 | Pending invitations of archived board   | Invalidate all pending invitations                                  | FR-INV-07            |
| Q&A 12 | Invited role applies on join            | Yes                                                                 | FR-INV-03            |
| Q&A 13 | Roles assignable by invitation          | Member only, for now                                                | FR-INV-02            |
| Q&A 14 | Board role overrides system role        | Not applicable (Member-only invitations)                            | FR-INV-08            |
| Q&A 15 | Task creation fields                    | Title required; description, due date, assignee, status optional    | FR-TASK-01           |
| Q&A 16 | Task view fields                        | Title, description, status, due date, assignee name                 | FR-TASK-02           |
| Q&A 17 | Custom task statuses                    | No; predefined and fixed (specific values: see Q&A 17 note, A-001)  | FR-TASK-03           |
| Q&A 18 | Task sort and page size                 | Creation date descending; 20 per page                               | FR-TASK-11/12        |
| Q&A 19 | Due date/status/assign as one action    | Yes, single Update task                                             | FR-TASK-04           |
| Q&A 20 | Task deletion                           | Archive (soft delete)                                               | FR-TASK-05           |

## 2. Answered by design docs

| ID   | Question                                                                 | Design answer                                                           | Source                    | Status     | Remaining                                  |
| ---- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------- | ---------- | ------------------------------------------ |
| Q-02 | Does a system Admin see all boards, or only boards they created/belong to? | "Admin gets all boards."                                                | API §GET /boards          | `Resolved` | — (binding per D-01)                       |
| Q-06 | Can a Member update any task in the board?                               | Title, description, dueDate — any board member can update freely.       | API §PATCH /tasks         | `Resolved` | — (binding per D-01)                       |
| Q-08 | What must the API provide for the invitation redirect flow?              | `GET /invitations/accept?token=` returning `boardId` or `requiresRegistration`. | API §accept       | `Partial`  | Authentication and register-with-token: Q-18, Q-19 |
| Q-09 | Can clients change the page size? Is there a maximum?                    | Yes, via `limit`.                                                       | API §GET /boards, /tasks  | `Resolved` | — maximum 100 (D-23)                       |
| Q-12 | Is the due date range inclusive? Which timezone?                         | `startDate` / `endDate` as ISO 8601 UTC examples.                       | API §GET /tasks           | `Partial`  | Inclusive bounds; timezone handling        |
| A-001 | Which fixed task statuses, and what default?                            | `TODO`, `IN_PROGRESS`, `DONE`; default `TODO`; sent as codes (D-08).    | DB §tasks                 | `Resolved` | —                                          |

## 2b. Resolved — team decisions (2026-10-13)

Decisions and their basis are in `requirements.md` §11.

| ID   | Question | Decision | Decision ID |
| ---- | -------- | -------- | ----------- |
| Q-01 | How is an Admin account created? | Seed script with credentials from environment variables. | D-12 |
| Q-13 | What authority do the DB/API design docs have? | Binding spec; the client's Q&A answers prevail on conflict. | D-01 |
| Q-14 | Codes or labels for role/status values? | Codes (`ADMIN`, `MEMBER`, `TODO`, `IN_PROGRESS`, `DONE`, …); labels are display text only. | D-08 |
| Q-15 | Invitation status set and spelling; status for an archived board's pending invitations? | `PENDING`, `ACCEPTED`, `EXPIRED`, `CANCELLED`; archived board → `CANCELLED`; `INACTIVE` not used. | D-06, D-07 |
| Q-17 | Adopt the designed auth responses? | Yes: `{ data: User, access }` for register and login. | D-02 |
| Q-21 | bcrypt or scrypt? | bcrypt. | D-05 |
| Q-22 | Jest or Vitest? | Jest (migrate). | D-04 |
| Q-23 | Apply `/api/v1`? | Yes, to all endpoints. | D-03 |
| Q-27 | What causes 409 on boards? Unique names? | Names are not unique; no 409 on `POST`/`PATCH /boards`. | D-10 |
| Q-36 | Does a Member see all tasks of their boards, or only assigned ones? | All non-archived tasks of the boards they belong to. | D-13 |
| Q-16 | `VALIDATION_FAILED` vs `BAD_REQUEST`; error key? | Key `errors` (D-09); `VALIDATION_FAILED` for field errors, `BAD_REQUEST` for unreadable requests. | D-09, D-14 |
| Q-24 | Keep `GET /auth/me` and `GET /`? | Remove both. | D-18 |
| Q-25 | Invitation expiry storage; token? | `expiresAt` = created + 7 days; random token stored as SHA-256 hash, unique, single-use. | D-19 |
| Q-26 | `board_members` constraints? | Unique (boardId, userId) + `createdAt`; no role column; creator not auto-added. | D-20 |
| Q-32 | Password and case rules? | Password ≥ 8 chars; email lowercased; username case-sensitive. | D-16 |
| Q-33 | `dueDate` type; naming convention? | Datetime (D-11); camelCase fields, design table names. | D-11, D-15 |
| Q-35 | JWT expiry and claims? | 1 hour, no refresh token, `{ sub, email, role }`. | D-17 |

## 2c. Resolved — product owner (2026-10-15)

| ID   | Question | Answer | Decision ID |
| ---- | -------- | ------ | ----------- |
| Q-31 | Board search matching? | Partial match ("contains"), case-insensitive. | D-21 |
| Q-39 | Can an Admin still list or view archived boards? | No. Archived boards are hidden from everyone; `GET`/`PATCH`/`DELETE /boards/:id` on an archived board → 404. | D-22 |
| Q-09 | Maximum `limit`? | `limit` integer 1–100 (default per endpoint); `page` integer ≥ 1 (default 1); out of range → 400 `VALIDATION_FAILED`. | D-23 |
| Q-28 (boards) | 403 vs 404 on `/boards/:id`? | Unknown or archived board → 404 for everyone; existing board the Member does not belong to → 403. | D-24 |

## 3. Open

### 3.1 Carried over (not covered by any source)

| ID   | Question                                                                                                                   | Related                 | Status |
| ---- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------ |
| Q-03 | Can archived boards/tasks be restored? Is a restore endpoint required? (None is documented.)                               | FR-BOARD-03, FR-TASK-05 | `Open` |
| Q-04 | What happens to a board's tasks when the board is archived?                                                                | FR-BOARD-03             | `Open` |
| Q-05 | Can a Member assign a task to **themselves** ("other member")? Can a task be unassigned?                                   | FR-TASK-25              | `Open` |
| Q-07 | Invitations: user registers with a different email than invited; duplicate/re-invite; revoke; inviting an existing member? | FR-INV-01 … 07          | `Open` |
| Q-10 | Can members be removed from a board, or leave it?                                                                          | FR-INV-*                | `Open` |
| Q-11 | What code coverage percentage counts as "high"?                                                                            | NFR-02                  | `Open` |

### 3.2 Raised by the design review (2026-10-13)

| ID   | Question                                                                                                                                                        | Related                                  | Status |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------ |
| Q-18 | Is `GET /invitations/accept` authenticated? Must the logged-in user's email match the invitation email? Should accepting (a state change) use GET?            | DES-INV-02, FR-INV-06                    | `Open` |
| Q-19 | After sign-up, how is the invitation auto-accepted? `POST /auth/register` has no `token` field.                                                                 | DES-INV-02, AC-INV-06                    | `Open` |
| Q-20 | Which status code for accepting an expired, cancelled or already-accepted invitation (API lists 404 and 409)?                                                   | FR-INV-05, AC-INV-03                     | `Open` |
| Q-28 | Which endpoints return **403** vs **404** for non-members? Missing codes: 403/404 on `POST /tasks`, 403 on `GET /tasks/:taskId`, 401 on most endpoints.         | AC-BOARD-09, AC-TASK-13                  | `Partial` — boards answered (D-24); tasks still open |
| Q-29 | Is `boardId` required on `GET /tasks`?                                                                                                                          | DES-TASK-04                              | `Open` |
| Q-30 | Which `sortBy` fields and `order` values are allowed?                                                                                                           | DES-TASK-04, FR-TASK-12                  | `Open` |
| Q-34 | What causes **409** on `POST /invitations` (already a member? pending invitation exists?) Should 400 and 404 (unknown board) be documented?                     | FR-INV-01, Q-07                          | `Open` |
| Q-37 | Task creation: may a Member who is not the assignee set a non-default `status` on `POST /tasks`? Which status code when `assigneeId` is not a board member (only 400 is documented)? | FR-TASK-01, FR-TASK-24/25, DES-TASK-04 | `Open` |
| Q-38 | Are all task status transitions allowed (e.g. `DONE` → `TODO`), or only forward?                                                                                | FR-TASK-03, DES-TASK-01                  | `Open` |
