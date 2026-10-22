# Requirements — Trello-lite

> **Sources (read-only, `docs/source/`):**
>
> | Doc | File | Reference style |
> | --- | ---- | --------------- |
> | Business requirements + Q&A ("Node.js Practice", 31 Mar 2026) | [`nodejs-practice-original.md`](./source/nodejs-practice-original.md) | **FR**, **Q&A n**, **TS**, **Target** |
> | Database design (31 Mar 2026) | [`trello-lite-database-design.md`](./source/trello-lite-database-design.md) | **DB §table** |
> | API design (31 Mar 2026) | [`trello-lite-api-design.md`](./source/trello-lite-api-design.md) | **API §endpoint** |
>
> - The DB design's ER **diagram is not included** (the source shows only "Link").
> - Q&A numbering (1–20) in [section 7](#7-qa-from-source-document) was added
>   for reference; it is not in the original.
> - **Precedence on conflict:** original Q&A answer > original FR > API design
>   > DB design. Conflicts are recorded as contradictions
>   ([section 10](#10-contradictions-in-the-sources)) and in
>   [`clarifying-questions.md`](./clarifying-questions.md); they are never
>   silently resolved.
> - Only the product owner may confirm a requirement, acknowledge an
>   assumption or answer an open question.

## Status legend

| Status        | Meaning                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `Confirmed`   | Stated in the original FR or confirmed in its Q&A.                                                                             |
| `Designed`    | Specified in the DB/API design docs. **Binding spec** (D-01); the client's Q&A answers prevail on conflict. Contradictions between the design docs are settled by team decisions (§11). |
| `Assumption`  | Proposed but not confirmed or designed. Do not rely on it without sign-off.                                                   |
| `Open`        | Not covered by any source. Ask before implementing.                                                                           |
| `Implemented` | Confirmed/Designed and shipped; link the ticket.                                                                              |

> Business requirements (`Confirmed`) describe **what** the system must do.
> Design items (`Designed`) describe **how** the documented design realises
> them. Code in the repository is neither (see [section 9](#9-deviations-between-sources-and-repository)).

## 1. Overview

Develop a RESTful backend API for a lightweight task management system
(Trello-lite) that supports:

- Multi-user collaboration
- Task lifecycle management
- Role-based access control

### Training targets (source: Target)

- Design and implement an API: endpoints, HTTP methods (GET, POST, PUT,
  DELETE), request/response, data validation and error handling.
- Integrate a database: connections and CRUD operations.
- API testing with high code coverage.
- Detailed API documentation.

## 2. Technology stack

| Area             | Required             | Source | Repo today              | Status                                                      |
| ---------------- | -------------------- | ------ | ----------------------- | ----------------------------------------------------------- |
| Language         | Node.js (TypeScript) | TS     | Node.js (TypeScript)    | `Confirmed` — matches                                       |
| Framework        | NestJS               | TS     | NestJS 12               | `Confirmed` — matches                                       |
| Database         | PostgreSQL           | TS     | PostgreSQL              | `Confirmed` — matches (TL-003)                              |
| ORM              | Prisma               | TS     | Prisma 7                | `Confirmed` — matches (TL-003)                              |
| Authentication   | JWT                  | TS     | `@nestjs/jwt`           | `Confirmed` — matches                                       |
| Testing          | **Jest**             | TS     | **Jest 30**             | `Confirmed` — matches (migrated in TL-001)                  |
| Documentation    | Swagger              | TS     | —                       | `Confirmed` — implemented (TL-005)                          |
| Password hashing | **bcrypt**           | DB §users | bcrypt (`bcryptjs`)  | `Designed` — matches (TL-003)                               |

## 3. Roles

| ID         | Requirement                                                                                    | Status      | Source | Design                                     |
| ---------- | ---------------------------------------------------------------------------------------------- | ----------- | ------ | ------------------------------------------ |
| FR-ROLE-01 | System roles: **Admin** (full permissions) and **Member** (limited to assigned boards/tasks). | `Confirmed` | FR     | DB §users `role`; API §Objects `USERS`     |
| FR-ROLE-02 | A newly registered user is assigned the **Member** role by default.                            | `Confirmed` | Q&A 2  | API §POST /auth/register                   |

## 4. Functional requirements

### 4.1 Authentication

| ID         | Requirement                                                | Status      | Source    | Design                    |
| ---------- | ---------------------------------------------------------- | ----------- | --------- | ------------------------- |
| FR-AUTH-01 | User registration with **username, email and password**.   | `Confirmed` | FR        | API §POST /auth/register; DB §users |
| FR-AUTH-02 | Login with **email + password**, returning a JWT.           | `Confirmed` | FR, Q&A 1 | API §POST /auth/login     |
| FR-AUTH-03 | Role-based access control enforced on protected endpoints. | `Confirmed` | FR        | API §Headers (Bearer)     |

Implementation status: FR-AUTH-01/02 implemented with the designed
responses (TL-003, TL-004). FR-AUTH-03: `RolesGuard` + `@Roles()` implemented
in TL-004; board-level checks follow in TL-006.

### 4.2 Board management

| ID          | Requirement                                                                     | Status      | Source    | Design                          |
| ----------- | ------------------------------------------------------------------------------- | ----------- | --------- | ------------------------------- |
| FR-BOARD-01 | Admin can **create** a board with a **name** and **description**.              | `Confirmed` | FR, Q&A 3 | API §POST /boards; DB §boards   |
| FR-BOARD-02 | Admin can **update** a board; only **name** and **description** are updatable. | `Confirmed` | FR, Q&A 5 | API §PATCH /boards/:id          |
| FR-BOARD-03 | Admin can **soft delete (archive)** a board.                                    | `Confirmed` | FR, Q&A 7 | API §DELETE /boards/:id; DB §boards `deletedAt` |
| FR-BOARD-04 | Admin can **view** boards.                                                      | `Confirmed` | FR        | API §GET /boards, §GET /boards/:id |
| FR-BOARD-05 | Member can view **only the boards they belong to**.                             | `Confirmed` | FR        | API §GET /boards; DB §board_members |
| FR-BOARD-06 | Viewing a board shows its **name** and **description**.                         | `Confirmed` | Q&A 4     | API §Objects `BOARDS`           |
| FR-BOARD-07 | Board list supports **search by name**.                                         | `Confirmed` | Q&A 6     | API §GET /boards `?search`      |
| FR-BOARD-08 | Board list shows **10 boards** per page by default.                             | `Confirmed` | Q&A 6     | API §GET /boards `?page&limit`  |
| FR-BOARD-09 | Board list is sorted by **creation date descending** by default.                | `Confirmed` | Q&A 6     | API §GET /boards                |

> Q&A 6 answer overrides the BA's assumption of 20 boards per page.

### 4.3 Board membership & invitations

| ID        | Requirement                                                                                                                                                    | Status      | Source | Design                                   |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------ | ---------------------------------------- |
| FR-INV-01 | Admin can **invite a user to a board** with a specified role.                                                                                                   | `Confirmed` | FR     | API §POST /invitations; DB §invitations  |
| FR-INV-02 | For now, invited users can only be assigned the **Member** board role.                                                                                          | `Confirmed` | Q&A 13 | API §POST /invitations ("Role is always MEMBER") |
| FR-INV-03 | The invited role applies once the user joins the board.                                                                                                         | `Confirmed` | Q&A 12 | DB §invitations `role` (see C-09)        |
| FR-INV-04 | Invitations are sent **via email**.                                                                                                                             | `Confirmed` | Q&A 8  | API §POST /invitations                   |
| FR-INV-05 | An invitation **expires after 7 days**.                                                                                                                         | `Confirmed` | FR     | API §POST /invitations (no DB column — Q-25) |
| FR-INV-06 | Invitation link flow: user **with an account** → redirected to the board; user **without an account** → sign-up → after registering, redirected to the board. | `Confirmed` | Q&A 10 | API §GET /invitations/accept             |
| FR-INV-07 | When a board is archived, all of its **pending invitations are invalidated**.                                                                                   | `Confirmed` | Q&A 11 | API §DELETE /boards/:id; status becomes `CANCELLED` (D-07) |
| FR-INV-08 | Board role overriding system role is not applicable, because invitations only grant the Member role.                                                           | `Confirmed` | Q&A 14 | —                                        |

### 4.4 Task management

#### Task data

| ID         | Requirement                                                                                         | Status      | Source     | Design                           |
| ---------- | --------------------------------------------------------------------------------------------------- | ----------- | ---------- | -------------------------------- |
| FR-TASK-01 | Creating a task requires a **title**; **description, due date, assignee and status** are optional. | `Confirmed` | Q&A 15     | API §POST /tasks; DB §tasks      |
| FR-TASK-02 | Viewing a task shows **title, description, status, due date** and the **assignee's name**.         | `Confirmed` | Q&A 16     | API §Objects `TASKS` (`assignee: User`) |
| FR-TASK-03 | Task statuses are a **predefined, fixed set**; users cannot customize or create statuses.           | `Confirmed` | Q&A 17     | DB §tasks `status` (values: DES-TASK-01) |
| FR-TASK-04 | Setting due date, changing status and assigning are all part of a **single Update task** action.   | `Confirmed` | Q&A 19     | API §PATCH /tasks/:taskId        |
| FR-TASK-05 | Deleting a task is a **soft delete (archive)**.                                                     | `Confirmed` | FR, Q&A 20 | API §DELETE /tasks/:id; DB §tasks `deletedAt` |

#### Task listing

| ID         | Requirement                                                     | Status      | Source     | Design                                                  |
| ---------- | --------------------------------------------------------------- | ----------- | ---------- | ------------------------------------------------------- |
| FR-TASK-10 | Filter tasks by **assignee**, **status** and **due date range**. | `Confirmed` | FR         | API §GET /tasks `?assigneeId&status&startDate&endDate` |
| FR-TASK-11 | Task list is **paginated**, **20 tasks** per page by default.   | `Confirmed` | FR, Q&A 18 | API §GET /tasks `?page&limit`                           |
| FR-TASK-12 | Task list is sorted by **creation date descending** by default. | `Confirmed` | FR, Q&A 18 | API §GET /tasks `?sortBy&order`                         |

#### Task permissions

| Action                              | Admin                           | Member in board                            | Source | Design                 |
| ----------------------------------- | ------------------------------- | ------------------------------------------ | ------ | ---------------------- |
| View tasks (filter, paginate, sort) | ✅                              | ✅                                         | FR     | API §GET /tasks        |
| Create task                         | ✅                              | ✅                                         | FR     | API §POST /tasks       |
| Update task                         | ✅                              | ✅                                         | FR     | API §PATCH /tasks      |
| Set due date                        | ✅                              | ✅                                         | FR     | API §PATCH /tasks      |
| Change task status                  | ✅                              | ✅ **only if they are the assignee**       | FR     | API §PATCH /tasks      |
| Assign task                         | ✅ to **any user in the board** | ✅ to **another member in the same board** | FR     | API §PATCH /tasks      |
| Soft delete task                    | ✅                              | ❌                                         | FR     | API §DELETE /tasks/:id |

All rows above are `Confirmed` (IDs FR-TASK-20 … FR-TASK-26 in table order).

> Decided: Members see all (non-archived) tasks of the boards they belong to
> (D-13). Open: rules for `status`/`assigneeId` at creation (Q-37); allowed
> status transitions (Q-38); self-assignment (Q-05).

### 4.5 Acceptance criteria (derived from the sources)

> Each criterion cites the requirement and source it derives from. Criteria
> whose expected result depends on an unresolved item name it; they are not
> testable until it is answered. API paths omit the `/api/v1` prefix (DES-API-01).

#### Authentication

| ID         | Given / When / Then                                                                                                                       | Traces to                              |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| AC-AUTH-01 | Given a new username, email and password, when `POST /auth/register`, then **201** and the user has role **MEMBER**.                     | FR-AUTH-01, FR-ROLE-02; API §register  |
| AC-AUTH-02 | Given an already-registered username or email, when `POST /auth/register`, then **409**.                                                  | DB §users UNIQUE; API §register        |
| AC-AUTH-03 | Given a request missing username, email or password, when `POST /auth/register`, then **400**.                                           | FR-AUTH-01; API §register              |
| AC-AUTH-04 | Given valid credentials, when `POST /auth/login` with email + password, then **200** with the user and a bearer token.                    | FR-AUTH-02, Q&A 1; API §login (shape: DEV-007) |
| AC-AUTH-05 | Given a wrong password or unknown email, when `POST /auth/login`, then **401**.                                                           | FR-AUTH-02; API §login                 |
| AC-AUTH-06 | Given no or an invalid bearer token, when calling an authenticated endpoint, then **401**.                                                 | FR-AUTH-03; API §Common errors         |
| AC-AUTH-07 | Given a registration request containing `role`, when registering, then the user is still **MEMBER**.                                      | FR-ROLE-02                             |

#### Boards

| ID          | Given / When / Then                                                                                                                 | Traces to                                |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| AC-BOARD-01 | Given an Admin, when `POST /boards` with name and description, then **201** with the board.                                         | FR-BOARD-01, Q&A 3; API §POST /boards    |
| AC-BOARD-02 | Given a Member, when `POST`, `PATCH` or `DELETE /boards…`, then **403**.                                                            | FR-BOARD-01…03; API §boards              |
| AC-BOARD-03 | Given an Admin, when `PATCH /boards/:id` with name and/or description, then **200**; no other field changes.                        | FR-BOARD-02, Q&A 5; API §PATCH /boards   |
| AC-BOARD-04 | Given an Admin, when `DELETE /boards/:id`, then **204**, the board gets `deletedAt` and is not physically removed.                   | FR-BOARD-03, Q&A 7; API §DELETE /boards  |
| AC-BOARD-05 | Given more than 10 visible boards, when `GET /boards` without `limit`, then 10 boards are returned, newest first, with `meta`.        | FR-BOARD-08/09, Q&A 6; API §GET /boards  |
| AC-BOARD-06 | Given boards named "Project A" and "Other", when `GET /boards?search=project`, then only matching boards are returned ("contains", case-insensitive: D-21). | FR-BOARD-07; API §GET /boards       |
| AC-BOARD-07 | Given a Member of board A but not board B, when `GET /boards`, then only board A is returned.                                       | FR-BOARD-05; API §GET /boards            |
| AC-BOARD-08 | Given an Admin, when `GET /boards`, then all boards are returned.                                                                   | DES-BOARD-01                             |
| AC-BOARD-09 | Given a Member not in board B, when `GET /boards/:id` for B, then **403**.                                                          | FR-BOARD-05; API §GET /boards/:id        |
| AC-BOARD-10 | Given a non-existent board id, when `GET`, `PATCH` or `DELETE /boards/:id`, then **404**.                                           | API §boards                              |

#### Invitations

| ID        | Given / When / Then                                                                                                                         | Traces to                                  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| AC-INV-01 | Given an Admin, when `POST /invitations` with email and boardId, then **204**, an invitation with role **MEMBER** is stored and an email is sent. | FR-INV-01/02/04; API §POST /invitations |
| AC-INV-02 | Given a Member, when `POST /invitations`, then **403**.                                                                                      | FR-INV-01; API §POST /invitations          |
| AC-INV-03 | Given an invitation older than 7 days, when it is accepted, then it is rejected (status code: Q-20).                                         | FR-INV-05                                  |
| AC-INV-04 | Given a valid token for an email with an account, when `GET /invitations/accept?token=`, then **200** `{data: {boardId}}` and the user becomes a board member with role MEMBER. | FR-INV-03/06; API §accept |
| AC-INV-05 | Given a valid token for an email without an account, when `GET /invitations/accept?token=`, then **200** `{data: {requiresRegistration: true, email, boardId}}`. | FR-INV-06; API §accept |
| AC-INV-06 | Given that user then registers, when registration completes, then the invitation is accepted automatically (mechanism: Q-19).               | FR-INV-06; API §accept                     |
| AC-INV-07 | Given an unknown token, when accepting, then **404**.                                                                                       | API §accept                                |
| AC-INV-08 | Given a board with pending invitations, when an Admin archives it, then all of its pending invitations become `CANCELLED` (D-07). | FR-INV-07, Q&A 11; API §DELETE /boards     |

#### Tasks

| ID         | Given / When / Then                                                                                                                       | Traces to                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| AC-TASK-01 | Given a board member, when `POST /tasks` with only boardId and title, then **201** and status defaults to **TODO**.                       | FR-TASK-01, DES-TASK-01; API §POST /tasks |
| AC-TASK-02 | Given a request without title, when `POST /tasks`, then **400**.                                                                          | FR-TASK-01; API §POST /tasks            |
| AC-TASK-03 | Given a status outside the fixed set, when creating or updating a task, then **400**.                                                     | FR-TASK-03                              |
| AC-TASK-04 | Given a task, when `GET /tasks/:taskId`, then **200** with title, description, status, dueDate and assignee.                              | FR-TASK-02, Q&A 16; API §GET /tasks/:taskId |
| AC-TASK-05 | Given more than 20 tasks, when `GET /tasks` without `limit`, then 20 tasks are returned, newest first, with `meta`.                       | FR-TASK-11/12, Q&A 18; API §GET /tasks  |
| AC-TASK-06 | Given tasks with different assignees, statuses and due dates, when filtering by `assigneeId`, `status`, `startDate`/`endDate`, then only matching tasks are returned (range bounds: Q-12). | FR-TASK-10; API §GET /tasks |
| AC-TASK-07 | Given a Member who is not the assignee, when `PATCH /tasks/:taskId` with `status`, then **403**.                                          | FR-TASK-24; API §PATCH /tasks           |
| AC-TASK-08 | Given a Member who is the assignee, when `PATCH` with `status`, then **200**.                                                              | FR-TASK-24; API §PATCH /tasks           |
| AC-TASK-09 | Given a Member, when `PATCH` with an `assigneeId` who is not a member of the board, then **403**.                                         | FR-TASK-25; API §PATCH /tasks           |
| AC-TASK-10 | Given a board member, when `PATCH` title, description or dueDate of a task in that board, then **200**.                                   | FR-TASK-22/23, DES-TASK-02; API §PATCH /tasks |
| AC-TASK-11 | Given an Admin, when `DELETE /tasks/:id`, then **204** and the task is excluded from all later queries.                                   | FR-TASK-05/26; API §DELETE /tasks       |
| AC-TASK-12 | Given a Member, when `DELETE /tasks/:id`, then **403**.                                                                                   | FR-TASK-26; API §DELETE /tasks          |
| AC-TASK-13 | Given a user who is not a member of the board, when listing, creating or updating its tasks, then **403** (code per endpoint: Q-28).      | FR-ROLE-01; API §GET /tasks             |
| AC-TASK-14 | Given a Member of board A and tasks in A assigned to other users, when `GET /tasks?boardId=A`, then those tasks are included. | D-13, FR-TASK-20; API §GET /tasks |

### 4.6 Designed items (from DB/API design, not confirmed in Q&A)

| ID           | Design rule                                                                                                       | Status     | Source                       | Notes                                   |
| ------------ | ----------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------- | --------------------------------------- |
| DES-API-01   | Base URL is `/api/v1`.                                                                                            | `Designed` | API §Design patterns         | Implemented (TL-002)                    |
| DES-API-02   | Authenticated requests send `Authorization: Bearer <token>` and `Content-Type: application/json`.                 | `Designed` | API §Headers                 | Matches code                            |
| DES-API-03   | List responses: `{ meta: { total, totalPages, limit, page }, data: [] }`.                                         | `Designed` | API §Metadata                |                                         |
| DES-API-04   | Single-item responses: `{ data: … }`.                                                                             | `Designed` | API §endpoints               | `DataResponse<T>` type (TL-004)         |
| DES-API-05   | Error responses use `{ "errors": { code, message, details? } }` (D-09); `VALIDATION_FAILED` for field errors, `BAD_REQUEST` for unreadable requests (D-14). | `Designed` | API §Errors Response         | Implemented (TL-002)                    |
| DES-AUTH-01  | Register returns **201** `{ data: User, access: "<token>" }`.                                                     | `Designed` | API §POST /auth/register     | Implemented (TL-004)                    |
| DES-AUTH-02  | Login returns **200** `{ data: User, access: "<token>" }`.                                                        | `Designed` | API §POST /auth/login        | Implemented (TL-004)                    |
| DES-AUTH-03  | Passwords are stored as **bcrypt** hashes.                                                                        | `Designed` | DB §users                    | Implemented (TL-003)                    |
| DES-USER-01  | Users have `id, username, email, role, createdAt, updatedAt`; username and email are unique.                      | `Designed` | DB §users; API §Objects      | Implemented (TL-003)                    |
| DES-BOARD-01 | **Admin gets all boards**; Member gets only boards they belong to.                                                | `Designed` | API §GET /boards             | Answers Q-02 (binding per D-01)         |
| DES-BOARD-02 | Archiving sets `deletedAt`; all pending invitations of the board are auto-cancelled.                              | `Designed` | API §DELETE /boards/:id      | Status naming: C-03                     |
| DES-BOARD-03 | Board response: `id, name, description, createdBy, createdAt, updatedAt, deletedAt`.                              | `Designed` | API §Objects                 |                                         |
| DES-INV-01   | `POST /invitations { email, boardId }` → **204**; `invitedBy` set to the Admin; role always MEMBER.               | `Designed` | API §POST /invitations       |                                         |
| DES-INV-02   | `GET /invitations/accept?token=` returns `{data:{boardId}}` or `{data:{requiresRegistration, email, boardId}}`.  | `Designed` | API §accept                  | Auth and register-with-token: Q-18, Q-19 |
| DES-INV-03   | Invitation statuses: `PENDING`, `ACCEPTED`, `EXPIRED`, `CANCELLED` (API spelling, D-06). `INACTIVE` is not used (D-07). | `Designed` | API §Constants; DB §invitations | DB spelling `ACCEPT`/`CANCCELD` superseded |
| DES-TASK-01  | Task statuses are `TODO`, `IN_PROGRESS`, `DONE`; default `TODO`. Sent and stored as these codes (D-08).          | `Designed` | DB §tasks; API §GET /tasks   | Resolves assumption A-001               |
| DES-TASK-02  | Any board member can update title, description, dueDate of any task in the board.                                 | `Designed` | API §PATCH /tasks            | Answers Q-06 (binding per D-01)         |
| DES-TASK-03  | Task response includes `assignee` as a full User object.                                                          | `Designed` | API §Objects                 | Satisfies FR-TASK-02                    |
| DES-TASK-04  | `GET /tasks` query: `boardId, assigneeId, status, startDate, endDate, page, limit, sortBy, order`.                | `Designed` | API §GET /tasks              | Required params / allowed sorts: Q-29, Q-30 |

## 5. Non-functional requirements

| ID     | Requirement                                                                  | Status      | Source     |
| ------ | ---------------------------------------------------------------------------- | ----------- | ---------- |
| NFR-01 | RESTful API using GET, POST, PUT, DELETE with validation and error handling. | `Confirmed` | Target     |
| NFR-02 | API tests with **high code coverage** (target % not specified — Q-11).       | `Confirmed` | Target     |
| NFR-03 | Detailed API documentation with **Swagger**.                                 | `Confirmed` | Target, TS |
| NFR-04 | Data persisted in **PostgreSQL** via **Prisma** with CRUD operations.        | `Confirmed` | Target, TS |

> NFR-01 lists PUT; the API design uses PATCH for updates. Not treated as a
> contradiction (PATCH is a valid partial-update method), noted for awareness.

## 6. Assumptions (not confirmed)

| ID    | Assumption                                                                              | Why not confirmed                                                                                         | Status                                         |
| ----- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| A-001 | Task statuses are **To Do**, **In Progress**, **Done**; new tasks default to **To Do**. | Q&A 17 only confirms statuses are fixed; the specific list was the BA's note after the answer, with no "Yes". | **Resolved** — DB §tasks specifies `TODO`, `IN_PROGRESS`, `DONE`, default `TODO`, binding per D-01 (DES-TASK-01) |
| A-002 | Use **SendGrid** as the email provider.                                                 | Q&A 9: client has no preference; SendGrid is the BA's suggestion pending further research.               | `Assumption` — not acknowledged                |
| A-003 | Swagger docs are served at **`/api/docs`** (JSON at `/api/docs/json`), disabled when `NODE_ENV=production` unless `SWAGGER_ENABLED=true`. | No source specifies the docs route or production exposure. | **Acknowledged** by the user 2026-10-14 (TL-005) |

## 7. Q&A from source document

Recorded verbatim. ⇒ = BA's assumption; **Answer** = client's response.

### Authentication & Authorization

1. **Login with what — email or username?**
   ⇒ Assume: Log in with email + password.
   **Answer:** Yes.
2. **What role is assigned to a user when they register?**
   ⇒ I assume users are assigned the Member role by default.
   **Answer:** Yes.

### Board Management

3. **When someone creates a board, what information do they need to fill in?**
   ⇒ I assume a name and a description
   **Answer:** Yes.
4. **What information is shown when viewing a board?**
   ⇒ I assume each board will display the board name and description
   **Answer:** Yes.
5. **Which fields can be updated?**
   ⇒ I assume update name, description only
   **Answer:** Yes.
6. **Can users search or filter the list of boards?**
   ⇒ I assume users can search by name, results are paginated (20 boards per page), and sorted by creation date descending (newest first) by default.
   **Answer:**
   - The user can search boards by name.
   - Display 10 boards by default
   - Sort boards by creation date descending
7. **When a board is deleted, should it disappear permanently or just be hidden so it can be restored later?**
   ⇒ I assume the board is hidden (soft deleted), not permanently removed, so it can be restored if needed.
   **Answer:** Just archive board (soft delete).

### Board Membership & Invitations

8. **How do we invite users to join a board?**
   ⇒ I assume users will be invited via email.
   **Answer:** Yes.
9. **Do we have any preference for an email provider?**
   **Answer:** No, could you recommend a suitable option?
   ⇒ Further research may be needed to determine the best fit, but I suggest using SendGrid as it has been used in previous team projects.
10. **When someone receives an invitation link and clicks it, what should happen if they don't have an account yet?**
    ⇒ I assume two cases
    - Already has an account: redirected to the board
    - No account yet: redirected to the sign-up page → after registering → redirected to the board

    **Answer:** Yes, that's the correct flow.
11. **When the board is deleted, what should happen to invitations that haven't been accepted yet?**
    ⇒ I assume all pending invitations are automatically cancelled.
    **Answer:** Yes, we should invalidate all pending invitations of archived boards.
12. **When an Admin invites someone to a board with a specified role, does that role apply once the user joins?**
    **Answer:** Yes.
13. **What roles can be assigned when inviting someone to a board?**
    ⇒ I assume: the same as system roles — Admin or Member.
    **Answer:** For now, only assign Member roles to invited users.
14. **Does the board role override the system role within that board?**
    ⇒ For example: a system-level Member is invited as a board Admin — can they perform Admin actions within that board?
    **Answer:** Since we only allow inviting users to the board with Member roles (as confirmed above), this will not happen.

### Task Management

15. **When someone creates a task, what information do they need to fill in?**
    ⇒ I assume: a title (required). Optionally, they can also add a description, due date, assignee and status.
    **Answer:** Yes.
16. **What information is shown when viewing a task?**
    ⇒ I assume each task displays its title, description, status, due date, and the name of the person it's assigned to.
    **Answer:** Yes.
17. **Can users define their own task statuses, or should the system provide a fixed set?**
    **Answer:** No, the user cannot customize or create new task status. The task status is predefined and fixed.
    ⇒ I assume the system provides a fixed set of statuses like To Do, In Progress, and Done. New tasks default to To Do.
18. **How are tasks sorted in the list — newest first or oldest first? And how many tasks appear per page?**
    ⇒ I assume the tasks are sorted by creation date descending (newest first) by default. Each page shows 20 tasks.
    **Answer:** Yes.
19. **Are "Set due date", "Change task status", and "Assign task" separate actions, or are they all part of editing a task?**
    ⇒ I assume all is handled in a single Update task action.
    **Answer:** Yes.
20. **When a task is deleted, should it be gone permanently or just hidden?**
    ⇒ I assume the tasks are hidden (soft deleted), not permanently removed.
    **Answer:** Same as board, just archive (soft delete) tasks.

## 8. Open questions

All questions — resolved, answered by design, partial and open — are tracked
in [`docs/clarifying-questions.md`](./clarifying-questions.md). Do not
implement behaviour that depends on an `Open` or `Partial` question until it
is answered.

## 9. Deviations between sources and repository

> The repository is not proof of a requirement. Each row is a difference to
> resolve, not an accepted decision.

| ID      | Source says                                                       | Repository today                                                                                       | Related           | Status                       |
| ------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------- | ---------------------------- |
| DEV-001 | Testing with **Jest** (TS)                                        | Jest 30 (`jest.config.js`, `jest.e2e.config.js`)                                                       | D-04              | **Implemented** (TL-001)     |
| DEV-002 | Admin and Member roles (FR-ROLE-01)                               | `Role` enum only has `member`; no roles guard                                                          | FR-AUTH-03        | **Implemented** (TL-004)     |
| DEV-003 | PostgreSQL + Prisma (TS, DB design)                               | In-memory `UsersService`                                                                               | NFR-04            | **Implemented** (TL-003) |
| DEV-004 | Swagger (TS)                                                      | Not installed                                                                                          | NFR-03            | **Implemented** (TL-005)     |
| DEV-005 | **bcrypt** password hashes (DB §users)                            | Node `scrypt` (`src/auth/password-hasher.service.ts`)                                                  | D-05              | **Implemented** (TL-003, via `bcryptjs`) |
| DEV-006 | Base URL `/api/v1` (API §Design patterns)                         | No global prefix (`src/main.ts`)                                                                       | D-03              | **Implemented** (TL-002) |
| DEV-007 | Register/login return `{ data: User, access }` (API §auth)        | Register returns bare user, **no token**; login returns `{ accessToken }`, **no user**                 | D-02              | **Implemented** (TL-004)     |
| DEV-008 | Error envelope `{ errors: { code, message, details? } }`          | NestJS default `{ statusCode, message, error }`                                                        | D-09, D-14        | **Implemented** (TL-002) |
| DEV-009 | Role values `ADMIN` \| `MEMBER`                                   | `Role.Member = 'member'` (lowercase)                                                                   | D-08              | **Implemented** (TL-003) |
| DEV-010 | No `GET /auth/me`, no `GET /` documented                          | Both exist (`src/auth/auth.controller.ts`, `src/app.controller.ts`)                                    | D-18              | **Implemented** (TL-004): both removed |
| DEV-011 | Not specified                                                     | Code-only rules: password ≥ 8 chars; email trimmed + lowercased; username uniqueness case-insensitive; JWT expiry 1h, payload `{sub, email, role}`; user has no `updatedAt` | D-16, D-17, DES-USER-01 | **Implemented** (TL-003): password ≥ 8, lowercase email, 1h JWT and claims kept; username now case-sensitive; `updatedAt` added |

## 10. Contradictions in the sources

> Each links to a question in `clarifying-questions.md`. The Resolution
> column names the team decision (§11) that settles it, if any.

| ID   | Contradiction                                                                                                                                         | Sources                                              | Question | Resolution |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------- | ---------- |
| C-01 | Invitation status spelling: `ACCEPT`, `CANCCELD` vs `ACCEPTED`, `CANCELLED`.                                                                         | DB §invitations vs API §Constants                    | Q-15     | D-06: API spelling |
| C-02 | Constant values are labels (`ADMIN = "Admin"`, `TODO = "Todo"`, `IN_PROGRESS = "In Progress"`) but objects, DB and filters use codes (`ADMIN`, `TODO`). | API §Constants vs API §Objects, §GET /tasks; DB      | Q-14     | D-08: codes |
| C-03 | Pending invitations of an archived board: "invalidate" vs "auto-cancelled" vs an undefined `INACTIVE` status.                                        | Q&A 11 vs API §DELETE /boards vs API §Constants      | Q-15     | D-07: `CANCELLED` |
| C-04 | Error envelope key: `errors` (most examples) vs `error` (field-level example).                                                                       | API §Errors Response                                 | Q-16     | D-09: `errors` |
| C-05 | Invalid input code: `BAD_REQUEST` (common 400) vs `VALIDATION_FAILED` (examples).                                                                    | API §Errors Response, §Common errors                 | Q-16     | D-14: field errors → `VALIDATION_FAILED` |
| C-06 | `POST`/`PATCH /boards` may return **409**, but `boards.name` has no unique constraint.                                                               | API §boards vs DB §boards                            | Q-27     | D-10: no 409, names not unique |
| C-07 | `tasks.dueDate` is a `string`, but is filtered as an ISO datetime range.                                                                              | DB §tasks vs API §GET /tasks                         | Q-33     | D-11: datetime |
| C-08 | Naming: `created_by` (snake) vs `createdBy`/`invitedBy`; table `Users` vs lowercase; API text says `deleted_at`, `invited_by`.                       | DB §boards, §users; API §DELETE, §POST /invitations  | Q-33     | D-15: camelCase fields, design table names |
| C-09 | The invited role "applies once the user joins", but `board_members` has no role column.                                                             | Q&A 12 vs DB §board_members                          | Q-26     | D-20: no role column while only MEMBER exists |

## 11. Team decisions

> Decided by the project team (2026-10-13; D-14 … D-20 in a second round) where the sources were silent or
> contradicted each other. Recorded with the evidence they rest on.

| ID   | Decision                                                                                                  | Settles                | Basis                                                        |
| ---- | --------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------ |
| D-01 | The DB and API design docs are the **binding spec**; the client's Q&A answers prevail on conflict.         | Q-13; Q-02, Q-06, A-001 | Design docs authored for this project                        |
| D-02 | Register and login return `{ data: User, access: "<token>" }`; register also returns a token.             | Q-17, DEV-007          | API §POST /auth/register, §POST /auth/login                  |
| D-03 | All endpoints are served under `/api/v1`.                                                                 | Q-23, DEV-006          | API §Design patterns                                         |
| D-04 | Tests use **Jest** (migrate from Vitest).                                                                 | Q-22, DEV-001          | Original §Tech stacks                                        |
| D-05 | Passwords are hashed with **bcrypt**.                                                                     | Q-21, DEV-005          | DB §users                                                    |
| D-06 | Invitation statuses use the API spelling: `PENDING`, `ACCEPTED`, `EXPIRED`, `CANCELLED`.                  | C-01, Q-15             | API §Constants (DB spelling contains typos)                  |
| D-07 | Archiving a board sets its pending invitations to `CANCELLED`; `INACTIVE` is not used.                    | C-03, Q-15             | Q&A 11 + API §DELETE /boards ("auto-cancelled")              |
| D-08 | Enum values are sent and stored as codes (`ADMIN`, `MEMBER`, `TODO`, `IN_PROGRESS`, `DONE`, …); the labels are display text only. | C-02, Q-14, DEV-009 | API §Objects, §GET /tasks filter; DB          |
| D-09 | Error responses use the `errors` key: `{ "errors": { code, message, details? } }`.                         | C-04, Q-16 (part)      | Majority of API §Errors examples                             |
| D-10 | Board names are not unique; `POST`/`PATCH /boards` do not return 409.                                     | C-06, Q-27             | DB §boards has no unique constraint                          |
| D-11 | `tasks.dueDate` is a datetime.                                                                            | C-07, Q-33 (part)      | API §GET /tasks filters it as an ISO datetime range          |
| D-12 | Admin accounts are created by a seed script using credentials from environment variables.                 | Q-01                   | No source covers Admin creation; registration yields Member  |
| D-13 | Members see all (non-archived) tasks of the boards they belong to.                                        | Q-36                   | FR "Any member in board can: View tasks"; API §GET /tasks    |
| D-14 | `VALIDATION_FAILED` (with `details`) when a specific field in body, query or params is invalid; `BAD_REQUEST` when the request cannot be read (e.g. malformed JSON). | C-05, Q-16 | API §Errors examples use both codes |
| D-15 | Fields are camelCase everywhere (`created_by` → `createdBy`); table names as in the DB design: `users`, `boards`, `board_members`, `invitations`, `tasks`. | C-08, Q-33 | Majority convention in DB/API design |
| D-16 | Password: at least 8 characters. Email stored lowercased (unique). Username is case-sensitive (unique as stored). | Q-32 | DB §users UNIQUE; no source sets rules |
| D-17 | Access token expires after 1 hour; no refresh token; claims `{ sub, email, role }`. | Q-35 | No source specifies JWT details |
| D-18 | Remove the undocumented `GET /` and `GET /auth/me`. | Q-24, DEV-010 | Not in API design |
| D-19 | Invitations store `expiresAt` (= created + 7 days). Tokens are random, stored as a SHA-256 hash, unique and single-use. | Q-25 | FR 7-day expiry; DB §invitations "Unique token" |
| D-20 | `board_members`: unique (`boardId`, `userId`), plus `createdAt`; no role column while invitations only grant MEMBER; the creating Admin is not added automatically. | Q-26, C-09 | Q&A 13; Admins see all boards (DES-BOARD-01) |
| D-21 | Board search matches names partially ("contains") and case-insensitively. | Q-31 | Product owner answer (2026-10-15) |
| D-22 | Archived boards are hidden from everyone (Admins included): excluded from lists; `GET`/`PATCH`/`DELETE /boards/:id` → 404. | Q-39 | Product owner answer (2026-10-15) |
| D-23 | Pagination: `limit` integer 1–100, `page` integer ≥ 1 (default 1); out of range → 400 `VALIDATION_FAILED`. | Q-09 | Product owner answer (2026-10-15) |
| D-24 | `/boards/:id`: unknown or archived board → 404; existing board the Member does not belong to → 403. | Q-28 (boards part) | Product owner answer (2026-10-15); AC-BOARD-09/10 |

## 12. Change log

| Date       | Change                                                                                                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-13 | Initial placeholder structure.                                                                                                                                               |
| 2026-10-13 | Consolidated "Node.js Practice" requirements and Q&A; removed `clarifying-questions.md`.                                                                                     |
| 2026-10-13 | Added read-only sources in `docs/source/` (original, DB design, API design); added `Designed` status, design traceability, acceptance criteria (§4.5), designed items (§4.6), deviations DEV-005…011 and contradictions (§10); moved open questions back to `clarifying-questions.md`. |
| 2026-10-13 | Source docs reformatted to Markdown (wording unchanged; header URL/date lines removed). Added Q-36…Q-39 and the schema-blocking rule. |
| 2026-10-13 | Recorded team decisions D-01…D-13 (§11); resolved A-001, Q-01, Q-02, Q-06, Q-13…Q-15, Q-17, Q-21…Q-23, Q-27, Q-36; Q-16 and Q-33 partly; added AC-TASK-14. |
| 2026-10-13 | Recorded D-14…D-20; resolved Q-16, Q-24, Q-25, Q-26, Q-32, Q-33, Q-35, C-05, C-08, C-09. Tickets TL-001…TL-008 created. |
| 2026-10-13 | TL-001 done: tests migrated from Vitest to Jest (DEV-001 implemented). |
| 2026-10-13 | TL-002 done: `/api/v1` prefix and error envelope (DEV-006, DEV-008 implemented). |
| 2026-10-13 | TL-003 done: PostgreSQL + Prisma `users` table, bcrypt, role codes (DEV-003, DEV-005, DEV-009, DEV-011 implemented). |
| 2026-10-14 | TL-004 done: designed auth responses, roles guard, Admin seed (DEV-002, DEV-007, DEV-010 implemented). |
| 2026-10-14 | TL-005: Swagger docs at `/api/docs` (DEV-004 implemented); assumption A-003 acknowledged. |
| 2026-10-15 | Product owner answered Q-09, Q-31, Q-39 and the boards part of Q-28 (D-21…D-24). TL-006 implemented (in review): `boards`, `board_members`, board endpoints. |
