# Architecture

> Sections marked **Planned** describe intended direction only. They are not
> implemented and not final until recorded in the decision log.

## 1. Overview

- **Type:** REST API (JSON over HTTP)
- **Framework:** NestJS 12, TypeScript (strict), ESM
- **Entry point:** `src/main.ts` → `AppModule` (`src/app.module.ts`)
- **Default port:** `process.env.PORT ?? 3000`

## 2. Current state (implemented)

### 2.1 Modules

| Module          | Path          | Responsibility                                      |
| --------------- | ------------- | --------------------------------------------------- |
| `AppModule`     | `src/`        | Root module, global `ValidationPipe`, observability |
| `AuthModule`    | `src/auth/`   | Register, login, JWT, `RolesGuard` / `@Roles()`     |
| `UsersModule`   | `src/users/`  | User storage (PostgreSQL via Prisma) and lookups    |
| `BoardsModule`  | `src/boards/` | Board CRUD/archive, membership-based visibility     |
| `PrismaModule`  | `src/prisma/` | `PrismaService` (Prisma client, `pg` adapter)       |

### 2.2 Endpoints

| Method | Route            | Auth | Current behaviour             | Documented contract (`docs/source/trello-lite-api-design.md`)      |
| ------ | ---------------- | ---- | ----------------------------- | ------------------------------------------------------------------ |
| POST   | `/api/v1/auth/register` | No   | 201 `{ data: User, access }`  | 201 `{ data: User, access }` (D-02, TL-004)        |
| POST   | `/api/v1/auth/login`    | No   | 200 `{ data: User, access }`  | 200 `{ data: User, access }` (D-02, TL-004)        |
| GET    | `/api/v1/boards`        | JWT  | 200 `{ meta, data: [Board] }`; Admin: all, Member: own; archived hidden | As designed; search/limit per D-21, D-23 (TL-006) |
| GET    | `/api/v1/boards/:id`    | JWT  | 200 `{ data: Board }`; 403 non-member; 404 unknown/archived | As designed; D-22, D-24 (TL-006) |
| POST   | `/api/v1/boards`        | Admin | 201 `{ data: Board }`        | As designed; no 409 (D-10, TL-006)                 |
| PATCH  | `/api/v1/boards/:id`    | Admin | 200 `{ data: Board }`        | As designed; no 409 (D-10, TL-006)                 |
| DELETE | `/api/v1/boards/:id`    | Admin | 204 (sets `deletedAt`)       | As designed; invitation cancelling follows in TL-007 |

All routes are served under `/api/v1` (TL-002). `GET /` and `GET /auth/me`
were removed in TL-004 (D-18). Every error, including
unknown routes outside the prefix, uses the documented envelope (§3.5).

### 2.2.1 Documented endpoints not yet implemented

All under `/api/v1` (DES-API-01).

| Method | Route                          | Who                  | Success                         |
| ------ | ------------------------------ | -------------------- | ------------------------------- |
| POST   | `/invitations`                 | Admin                | 204                             |
| GET    | `/invitations/accept?token=`   | Open question (Q-18) | 200 `{ data: { boardId } }` or `{ data: { requiresRegistration, email, boardId } }` |
| GET    | `/tasks`                       | Board members, Admin | 200 `{ meta, data: [Task] }`    |
| POST   | `/tasks`                       | Board members, Admin | 201 `{ data: Task }`            |
| GET    | `/tasks/:taskId`               | Board members, Admin | 200 `{ data: Task }`            |
| PATCH  | `/tasks/:taskId`               | Board members, Admin | 200 `{ data: Task }`            |
| DELETE | `/tasks/:id`                   | Admin                | 204                             |

### 2.3 Cross-cutting

- **Validation:** global `ValidationPipe({ whitelist: true, transform: true })`.
- **Auth:** `JwtAuthGuard` verifies bearer tokens using `JWT_SECRET`.
- **Passwords:** bcrypt (`bcryptjs`, cost 10) via `PasswordHasherService` (D-05).
- **Persistence:** PostgreSQL via Prisma 7 (TL-003). Tables `users`,
  `boards` and `board_members` (TL-006) exist; unique-constraint violations
  become 409.
- **Pagination:** list queries extend `PaginationQueryDto`
  (`src/common/http/pagination-query.dto.ts`; `page` ≥ 1, `limit` 1–100,
  D-23) and return `ListResponse<T>` built with `buildMeta()`
  (`src/common/http/list-response.ts`).
- **Observability:** `@nestjs/observe` with placeholder credentials
  hard-coded in `app.module.ts` (to be moved to env vars — needs approval).

### 2.4 Configuration

| Variable     | Required | Used by        | Notes                    |
| ------------ | -------- | -------------- | ------------------------ |
| `JWT_SECRET` | Yes      | `AuthModule`   | Set in `.env`            |
| `PORT`       | No       | `main.ts`      | Defaults to 3000         |
| `DATABASE_URL` | Yes    | `PrismaService`, Prisma CLI | App database          |
| `TEST_DATABASE_URL` | E2E only | `test/setup-env.ts`, `test/global-setup.ts` | Name must end with `_test` |

## 3. Target architecture (Planned)

### 3.1 Persistence — PostgreSQL + Prisma (implemented in TL-003)

- **Schema:** `prisma/schema.prisma`; migrations in `prisma/migrations/`;
  config in `prisma.config.ts` (loads `.env` for the CLI).
- **Client:** Prisma 7 `prisma-client` generator (ESM, `.js` imports) into
  `src/generated/prisma/` (git-ignored, generated on install).
  `PrismaService` extends the client with the `@prisma/adapter-pg` driver
  adapter and disconnects on shutdown.
- **Workflow:** `pnpm db:migrate --name <change>` in dev, `pnpm db:deploy`
  elsewhere.
- **Local DB:** any PostgreSQL via `DATABASE_URL`; `docker-compose.yml`
  provides one on port 5433 with both databases.

### 3.2 Data model (Planned)

> Taken from `docs/source/trello-lite-database-design.md` (the ER diagram
> itself is not included in the source). No Prisma schema exists yet; schema
> work requires approval. Open schema questions are listed below the table.

```
users 1 ──< board_members >── 1 boards
users 1 ──< boards.created_by            (Admin who created it)
boards 1 ──< invitations >── 1 users     (invitedBy)
boards 1 ──< tasks
users 1 ──< tasks.createdBy
users 0..1 ──< tasks.assigneeId          (nullable)
```

| Table           | Fields (as designed)                                                                                       | Soft delete | Requirements                 |
| --------------- | ---------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------- |
| `users`         | id, username (UNIQUE), email (UNIQUE), password (bcrypt hash), role (`ADMIN` \| `MEMBER`), createdAt, updatedAt | —      | FR-AUTH-01, FR-ROLE-01/02    |
| `boards`        | id, name, description?, created_by → users, deletedAt?, createdAt, updatedAt                               | `deletedAt` | FR-BOARD-01 … 09             |
| `board_members` | id, boardId → boards, userId → users                                                                       | —           | FR-BOARD-05, FR-INV-03       |
| `invitations`   | id, boardId → boards, email, invitedBy → users, role (`MEMBER`), status, token, createdAt, updatedAt       | (status)    | FR-INV-01 … 07               |
| `tasks`         | id, boardId → boards, assigneeId? → users, createdBy → users, title, description?, status (default `TODO`), dueDate?, deletedAt?, createdAt, updatedAt | `deletedAt` | FR-TASK-01 … 05 |

**Schema questions** (see `docs/clarifying-questions.md`):

| Topic                                                      | Question / contradiction |
| ---------------------------------------------------------- | ------------------------ |
| Invitation status spelling and archived-board status       | Decided: D-06, D-07      |
| Invitation expiry storage; `token` uniqueness and hashing  | Decided: D-19            |
| `board_members` unique pair, role column, `createdAt`, Admin membership | Decided: D-20 |
| Board name uniqueness (409 on create/update)               | Decided: not unique, D-10 |
| `dueDate` type; naming conventions                         | Decided: D-11, D-15      |
| Archived board's tasks; restore                            | Q-04, Q-03               |

### 3.2.1 Prisma schema sketch (Proposed — not a schema file, no migration)

Shows which choices are fixed by the DB design and which are blocked.
Do not create `schema.prisma` until the blocking questions are answered.

```prisma
enum Role             { ADMIN MEMBER }                 // codes (D-08)
enum TaskStatus       { TODO IN_PROGRESS DONE }        // default TODO (DES-TASK-01); transitions: Q-38
enum InvitationStatus { PENDING ACCEPTED EXPIRED CANCELLED } // D-06; archived board → CANCELLED (D-07)

model User {
  id           String   @id @default(uuid())         // id format: ADR-008
  username     String   @unique                      // case-sensitive (D-16)
  email        String   @unique                      // stored lowercased (D-16)
  passwordHash String   @map("password")             // bcrypt (D-05)
  role         Role     @default(MEMBER)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Board {
  id          String    @id @default(uuid())
  name        String                                 // not unique (D-10)
  description String?
  createdById String                                 // → User; design's `created_by` (D-15)
  deletedAt   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model BoardMember {
  id      String @id @default(uuid())
  boardId String                                     // → Board
  userId  String                                     // → User
  createdAt DateTime @default(now())

  @@unique([boardId, userId])                       // D-20; no role column
}

model Invitation {
  id          String           @id @default(uuid())
  boardId     String                                 // → Board
  email       String
  invitedById String                                 // → User
  role        Role             @default(MEMBER)      // MEMBER only (FR-INV-02)
  status      InvitationStatus @default(PENDING)
  tokenHash   String           @unique               // SHA-256 of the emailed token, single-use (D-19)
  expiresAt   DateTime                               // createdAt + 7 days (D-19)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
}

model Task {
  id          String     @id @default(uuid())
  boardId     String                                 // → Board
  assigneeId  String?                                // → User
  createdById String                                 // → User
  title       String
  description String?
  status      TaskStatus @default(TODO)
  dueDate     DateTime?                              // datetime (D-11)
  deletedAt   DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}
```

Table names follow the DB design via `@@map` (`users`, `boards`, `board_members`,
`invitations`, `tasks`; D-15). No schema questions remain open; creating the
schema still requires approval in its ticket.
Likely indexes (technical, not business rules): `tasks(boardId, deletedAt, createdAt)`,
`boards(deletedAt, createdAt)`, `invitations(token)`.

### 3.3 Authorization model (Planned)

Confirmed rules (`docs/requirements.md` §3, §4):

- **Admin** — full permissions on boards, invitations and tasks.
- **Member** — only boards they belong to; within those boards may view,
  create and update tasks; may change status only if they are the assignee;
  may assign only to another member of the same board; may not delete tasks.

Designed (`docs/requirements.md` §4.6, binding per D-01) and decided:

- Admin sees **all** boards (DES-BOARD-01).
- Any board member may update title, description and dueDate of any task in
  the board (DES-TASK-02).
- Status codes for non-members follow the API design per endpoint (e.g. 403 on
  `GET /boards/:id`); gaps are tracked in Q-28.
- Members see all non-archived tasks of the boards they belong to (D-13).
- Admin accounts are created by a seed script with credentials from
  environment variables (D-12); registration always yields `MEMBER`.

Open: Member self-assignment (Q-05), task creation rules (Q-37).

Mechanism:

- **System roles (TL-004):** `@Roles([Role.ADMIN])` (`src/auth/roles.decorator.ts`)
  plus `RolesGuard` (`src/auth/roles.guard.ts`), applied as
  `@UseGuards(JwtAuthGuard, RolesGuard)`. The guard checks the `role` claim
  of the verified JWT; a missing token is 401 (JwtAuthGuard runs first), a
  wrong role is 403 `FORBIDDEN`. Handler roles override controller roles.
  Role changes take effect on the next login (tokens live 1 hour, D-17).
- **Board membership:** service-level checks, to be added in TL-006.

### 3.4 API documentation — Swagger (TL-005)

- **Setup:** `src/common/swagger/setup-swagger.ts`, called from
  `configureApp()`. Swagger UI at `/api/docs`, OpenAPI JSON at
  `/api/docs/json` (outside `/api/v1`; the 404 middleware lets these paths
  through only while docs are enabled). Route acknowledged by the user on
  2026-10-14 (A-003).
- **Enabled** unless `NODE_ENV=production`; `SWAGGER_ENABLED=true|false`
  overrides (any other value counts as `false`).
- **Auth scheme:** HTTP Bearer (JWT), scheme name `bearer`; the UI keeps the
  entered token (`persistAuthorization`). Guarded controllers add
  `@ApiBearerAuth()`.
- **Schemas:** request DTOs carry `@ApiProperty`. Response shapes are
  documentation-only classes that implement the real types
  (`UserDto implements PublicUser`, `AuthResponseDto implements AuthResponse`),
  plus `ErrorResponseDto` and `PaginationMetaDto`. Decorators in
  `src/common/swagger/api-responses.ts`: `ApiDataResponse` (`{ data }`),
  `ApiListResponse` (`{ meta, data }`), `ApiErrorResponse` (`{ errors }`).

### 3.5 API conventions (Planned)

- **Base URL (D-03, implemented in TL-002):** `/api/v1`, set by
  `configureApp()` (`src/configure-app.ts`), which `main.ts` and every e2e
  test must call. Paths outside the prefix return 404 in the error envelope.
- **Headers (designed):** `Content-Type: application/json`;
  `Authorization: Bearer <token>` on authenticated endpoints.
- **Response envelopes (designed; no interceptor — controllers return them
  explicitly, see ADR-006):** single item `{ data }`; list
  `{ meta: { total, totalPages, limit, page }, data: [] }`.
- **Error envelope (D-09, implemented in TL-002):** `{ errors: { code, message, details? } }`,
  produced by the global `ApiExceptionFilter` (`src/common/http/`). Throw
  Nest `HttpException`s; `code` is derived from the status, `message` is the
  explicit exception message or the API design's default; 5xx never expose
  internal messages and are logged server-side.
  `VALIDATION_FAILED` (with `details`) for invalid fields in body, query or
  params; `BAD_REQUEST` for unreadable requests (D-14).
  Codes: `BAD_REQUEST`, `VALIDATION_FAILED`,
  `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_SERVER_ERROR`.
- **Pagination defaults (confirmed):** boards 10 per page, tasks 20 per page;
  both sorted by `createdAt` descending. `limit` is client-settable; maximum
  is open (Q-09).
- **Soft delete (confirmed):** boards and tasks are archived via `deletedAt`,
  not removed; archived records are excluded from normal reads. Restore: Q-03.
- **Enum values (decided, D-08):** sent and stored as codes (`ADMIN`, `TODO`,
  `IN_PROGRESS`, …); the labels in the API design are display text only.
- **Auth responses (decided, D-02):** register and login return
  `{ data: User, access: "<token>" }`.

### 3.6 Email delivery (Planned)

- Invitations are sent by email (FR-INV-04). Provider is **not decided**;
  SendGrid is a proposal only (assumption A-002). Keep the provider behind an
  interface so tests can use a fake.

## 4. Testing strategy

> **Jest** (D-04, migrated in TL-001), running in native ESM mode because
> NestJS 12 ships ESM only (`--experimental-vm-modules`; `ts-jest` with
> `useESM`).

- **Unit:** Jest, `*.spec.ts` next to source (`jest.config.js`).
- **E2E:** Jest + supertest, `test/*.e2e-spec.ts` (`jest.e2e.config.js`;
  test env vars in `test/setup-env.ts`).
- **Coverage:** `pnpm test:cov` (v8 provider; excludes specs and `main.ts`).
- **Database in tests:** unit tests never touch a database (fakes/stubs).
  E2E tests use `TEST_DATABASE_URL`: `test/global-setup.ts` runs
  `prisma migrate deploy` once, `resetDatabase()` truncates all tables
  before each test (refuses non-`_test` databases), and e2e runs with
  `maxWorkers: 1` because suites share the database.

## 5. Decision log (ADR)

| ID      | Date | Decision | Status | Context / alternatives |
| ------- | ---- | -------- | ------ | ---------------------- |
| ADR-001 | 2026-10-13 | Use PostgreSQL + Prisma for persistence | `Accepted` (required by source) | Replaces the in-memory store |
| ADR-002 | 2026-10-13 | Boards and tasks use soft delete (archive) | `Accepted` (Q&A 7, 20) | Hard delete rejected by client |
| ADR-003 | 2026-10-13 | Keep Vitest instead of the required Jest | `Rejected` — superseded by ADR-009 | Source requires Jest (DEV-001) |
| ADR-004 | _TBD_ | Email provider | `Proposed` | SendGrid suggested (A-002) |
| ADR-005 | 2026-10-13 | Serve the API under `/api/v1` | `Accepted` (D-03) | Required by API design; changes existing routes and tests (DEV-006) |
| ADR-006 | 2026-10-13 | Use the designed error envelope via a global exception filter; controllers return `{ data }` / `{ meta, data }` explicitly (no response interceptor) | `Accepted` (D-02, D-09, D-14) — filter implemented in TL-002 | An interceptor cannot tell single items from paginated lists; explicit return types are clearer and easier to test |
| ADR-007 | 2026-10-13 | Hash passwords with bcrypt | `Accepted` (D-05) | Required by DB design; code uses scrypt (DEV-005); adds a dependency |
| ADR-008 | 2026-10-13 | Use UUID primary keys (`@default(uuid())`); a malformed id returns 400 | `Proposed` | DB design says "auto-generated string"; `GET /boards/:id` documents 400, implying a validated id format |
| ADR-009 | 2026-10-13 | Use Jest for unit and e2e tests | `Accepted` (D-04) — implemented in TL-001 | Required by source; native ESM mode with `ts-jest` (`@swc/jest` was the fallback, not needed) |
| ADR-010 | 2026-10-13 | Create Admin accounts with a seed script (credentials from env) | `Accepted` (D-12) — implemented in TL-004 (`pnpm db:seed`, `src/seed/`) | No source covers Admin creation; registration always yields `MEMBER` |
