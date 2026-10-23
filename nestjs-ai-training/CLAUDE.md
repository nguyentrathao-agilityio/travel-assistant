# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project purpose

A RESTful backend API for a lightweight task management system
(**Trello-lite**) supporting multi-user collaboration, task lifecycle
management and role-based access control (Admin / Member). Built for the
"Node.js Practice" training using an AI-assisted development workflow.

> Sources of truth live in `docs/source/` and are **read-only**:
> `nodejs-practice-original.md` (business requirements + Q&A),
> `trello-lite-database-design.md` (DB design) and
> `trello-lite-api-design.md` (API design). `docs/requirements.md`
> consolidates them with traceability; questions and contradictions live in
> `docs/clarifying-questions.md`.
> Implement `Confirmed` and `Designed` items only; never `Assumption` or
> `Open` items. Precedence on conflict: original Q&A > original FR > API
> design > DB design. When code, requirements and design disagree, stop and
> record a contradiction instead of choosing silently.

## Technology stack

| Area            | Status  | Choice                                                    |
| --------------- | ------- | --------------------------------------------------------- |
| Runtime         | In use  | Node.js, TypeScript (strict), ESM (`"type": "module"`)    |
| Framework       | In use  | NestJS 12 (`@nestjs/platform-express`)                    |
| Package manager | In use  | pnpm (`pnpm-lock.yaml` is committed)                      |
| Validation      | In use  | `class-validator` + global `ValidationPipe` (`whitelist`) |
| Auth            | In use  | JWT via `@nestjs/jwt`, custom `JwtAuthGuard`              |
| Password hash   | In use  | bcrypt via `bcryptjs` (`PasswordHasherService`) ²         |
| Tests           | In use  | Jest 30 + `ts-jest` (native ESM), supertest (e2e) ¹       |
| Lint / format   | In use  | oxlint (type-aware), Prettier                             |
| Database        | In use  | PostgreSQL (local, or `docker-compose.yml`)               |
| ORM             | In use  | Prisma 7 (`prisma/schema.prisma`, `@prisma/adapter-pg`)   |
| API docs        | In use  | Swagger (`@nestjs/swagger`), UI at `/api/docs`            |

"Planned" items are required by the source document but not installed yet.
Adding them requires approval (see below).

¹ NestJS 12 ships ESM only, so Jest runs with `--experimental-vm-modules`
(set in the `pnpm test*` scripts; the "VM Modules is an experimental feature"
warning is expected).

² `bcryptjs` implements the same bcrypt algorithm (`$2b$` hashes) as the
native `bcrypt` package without a native build step (D-05, TL-003).

## Commands

Run from this directory (`nestjs-ai-training/`):

```bash
pnpm start:dev     # run with watch, loads .env
pnpm build         # compile to dist/
pnpm lint          # oxlint --type-aware src/ test/
pnpm format        # prettier --write
pnpm test          # unit tests (**/*.spec.ts)
pnpm test:e2e      # e2e tests (**/*.e2e-spec.ts), config: jest.e2e.config.js
pnpm test:cov      # unit tests with coverage
pnpm test:watch    # unit tests in watch mode
pnpm db:migrate    # create/apply a migration in dev (prisma migrate dev)
pnpm db:deploy     # apply pending migrations (prisma migrate deploy)
pnpm db:generate   # regenerate the Prisma client after schema changes
pnpm db:seed       # build, then create the Admin from ADMIN_* env vars (idempotent)

# single file / single test (args are passed through to Jest)
pnpm test src/users/users.service.spec.ts
pnpm test src/users/users.service.spec.ts -t '409'
pnpm test:e2e test/auth.e2e-spec.ts
```

E2E tests need PostgreSQL running and `TEST_DATABASE_URL` set;
`test/setup-env.ts` points `DATABASE_URL` at it and sets its own `JWT_SECRET`.

## Architecture

- **Bootstrap:** `src/main.ts` → `configureApp()` (`src/configure-app.ts`)
  adds the `api/v1` global prefix and a middleware that answers any path
  outside the prefix with an enveloped 404. E2E tests call the same function,
  so everything app-level must live in `configureApp` or in `AppModule`.
- **Global pipe and filter** are registered in `AppModule` via `APP_PIPE` /
  `APP_FILTER` (not in `main.ts`): `ValidationPipe` (`whitelist`,
  `transform`) with `validationExceptionFactory`, which throws
  `ValidationFailedException`; `ApiExceptionFilter` turns every exception into
  `{ errors: { code, message, details? } }`. Both live in `src/common/http/`.
- **Auth:** `AuthModule` registers `JwtModule` (fails at startup without
  `JWT_SECRET`, 1h tokens) and exports `JwtAuthGuard`, which puts the verified
  `JwtPayload` on `request.user` (`AuthenticatedRequest`), and `RolesGuard`,
  which enforces `@Roles([Role.ADMIN])` (403 on a wrong role). Use them as
  `@UseGuards(JwtAuthGuard, RolesGuard)`. Feature modules import `AuthModule`
  to use the guards. Register/login return `AuthResponse`
  (`{ data: User, access }`).
- **Admin seed:** `src/seed/seed-admin.ts` (`readAdminSeedConfig`,
  `seedAdmin`), run by `src/seed/main.ts` via `pnpm db:seed`. It never
  promotes an existing Member and never resets an existing Admin's password.
- **API docs:** `configureApp()` calls `setupSwagger()`
  (`src/common/swagger/setup-swagger.ts`): UI at `/api/docs`, JSON at
  `/api/docs/json`, off when `NODE_ENV=production` unless
  `SWAGGER_ENABLED=true`.
- **Persistence:** `PrismaModule` provides `PrismaService` (generated client +
  `@prisma/adapter-pg`). Services such as `UsersService` use it directly and
  map Prisma errors (e.g. `P2002` → 409); controllers return public shapes
  (`toPublicUser`), never Prisma models. `Role` is re-exported from the
  generated client (`src/users/role.enum.ts`).
- **Boards:** `BoardsService` (`src/boards/`) filters archived boards
  (`deletedAt`) for everyone and limits Members to their `board_members`
  rows; `/boards/:id` is 404 when unknown/archived, 403 when the Member is
  not in the board. Paginated lists extend `PaginationQueryDto` and return
  `ListResponse<T>` via `buildMeta()` (`src/common/http/`).

## Database

- Set `DATABASE_URL` and `TEST_DATABASE_URL` in `.env` (see `.env.example`).
  Use your local PostgreSQL, or `docker compose up -d` (port 5433; creates
  both databases).
- First run: `pnpm db:deploy`. E2E tests migrate `TEST_DATABASE_URL`
  themselves and truncate all tables between tests, so its database name
  must end with `_test`.
- The Prisma client is generated into `src/generated/prisma/` (git-ignored)
  by `postinstall`; run `pnpm db:generate` after changing the schema.
- Schema changes always go through `pnpm db:migrate --name <change>` and
  need approval (see below).

## Repository conventions

- **ESM imports:** relative imports must include the `.js` extension
  (`import { AuthService } from './auth.service.js';`).
- **Type-only imports:** use `import type` for types used only in signatures.
- **Module layout:** one folder per feature under `src/<feature>/` containing
  `<feature>.module.ts`, `<feature>.controller.ts`, `<feature>.service.ts`,
  and a `dto/` folder for request DTOs.
- **DTOs:** validate every request body with `class-validator` decorators.
  Never accept server-controlled fields (ids, roles, timestamps) from clients.
- **Responses:** never return secrets (e.g. `passwordHash`); map entities to
  public shapes (see `toPublicUser`). Single items are wrapped in
  `DataResponse<T>` (`src/common/http/data-response.ts`).
- **Tests:**
  - Unit tests sit next to the code as `*.spec.ts`.
  - E2E tests live in `test/` as `*.e2e-spec.ts`.
  - Jest configs: `jest.config.js` (unit), `jest.e2e.config.js` (e2e; sets
    test env vars via `test/setup-env.ts`).
  - `describe`/`it`/`expect` are globals, but the `jest` object (`jest.fn()`,
    `jest.spyOn()`) is not available in ESM mode. Use small hand-written
    stubs; importing from `@jest/globals` first needs it added as a
    devDependency (approval required).
- **Style:** Prettier (single quotes, trailing commas) and oxlint must pass.
  No floating promises.
- **Swagger:** every endpoint gets `@ApiTags`, `@ApiOperation` and one
  response decorator per documented status: `@ApiOkResponse` /
  `@ApiCreatedResponse` with a response DTO, `ApiDataResponse` /
  `ApiListResponse` for `{ data }` / `{ meta, data }`, and `ApiErrorResponse`
  for errors (`src/common/swagger/api-responses.ts`). Request DTOs carry
  `@ApiProperty`; response DTOs implement the real type (e.g.
  `UserDto implements PublicUser`). Guarded controllers add
  `@ApiBearerAuth()`.
- **Errors:** throw Nest `HttpException`s (`NotFoundException`,
  `ConflictException('…')`, …); the global `ApiExceptionFilter` formats them as
  `{ errors: { code, message, details? } }`. Never build error bodies by
  hand. Validate body, query and params with DTOs so field errors become
  `VALIDATION_FAILED` (D-14).
- **Guarded routes in e2e:** `test/fixtures/protected.controller.ts` provides
  test-only JWT and Admin-only routes; import `[AppModule, AuthModule]` in
  the testing module to use it.
- **App setup:** e2e tests must call `configureApp(app)` before `init()` so
  routes get the `/api/v1` prefix, and call `resetDatabase()`
  (`test/utils/database.ts`) when they write data.
- **Unit tests stay database-free:** use fakes such as
  `test/fakes/in-memory-users.service.ts` or small hand-written stubs for
  `PrismaService`.
- **Config/secrets:** read from environment variables; document every new
  variable in `.env.example`. Never commit `.env`.
- **Docs:** `docs/source/` (read-only originals), `docs/requirements.md`
  (requirements, designed items, acceptance criteria, source Q&A copy,
  assumptions, deviations, contradictions), `docs/clarifying-questions.md`
  (all questions and their status), `docs/architecture.md`, `docs/tickets/`.
- **Claude Code hooks:** scripts live in `.claude/hooks/` (need `jq`).
  `.claude/settings.json` here and `../.claude/settings.json` at the repo
  root register the same hooks and must stay in sync. After changing
  `block-forbidden.sh`, run `.claude/hooks/block-forbidden.test.sh`.

## Workflow: Read → Plan → Test → Implement → Verify → Review

1. **Read** – Read the ticket, the related requirements, the relevant
   sections of `docs/source/` (including the API and DB design),
   `docs/clarifying-questions.md`, `docs/architecture.md`, and the existing
   code you will touch.
2. **Plan** – Write a short plan: files to change, approach, risks, and which
   requirement IDs it covers. For major changes (see below), stop and get
   approval before continuing.
3. **Test** – Write or update tests first (unit and/or e2e) that express the
   acceptance criteria. Confirm they fail for the right reason.
4. **Implement** – Make the smallest change that makes the tests pass. Follow
   the conventions above. No unrelated refactors.
5. **Verify** – Run `pnpm lint`, `pnpm test`, `pnpm test:e2e` and `pnpm build`.
   Report the actual results; never claim success without running them.
6. **Review** – Self-review the diff for correctness, security and scope.
   Update docs (architecture, requirements status, ticket) if behaviour
   changed. Summarize what changed and anything left open.

## Requirement verification rules

- Only implement behaviour that traces to a requirement marked `Confirmed`
  or `Designed` in `docs/requirements.md`, or that the user explicitly
  requested in the current conversation.
- Never edit files in `docs/source/`. They are the original documents.
- Design docs do not override the client's Q&A answers. If they conflict,
  record a contradiction (`docs/requirements.md` §10) and ask.
- Never invent business rules, or mark a requirement `Confirmed` yourself.
  Only the user/product owner confirms requirements.
- Never change the status of a `Confirmed` item or the verbatim source Q&A
  (`docs/requirements.md` section 7).
- When something is ambiguous, add a question to
  `docs/clarifying-questions.md` and ask, instead of guessing. Never reopen a
  `Resolved` question.
- If a reasonable assumption is needed to proceed, state it explicitly in the
  plan and in the ticket as an **Assumption**, and get it acknowledged.
- Existing code is not proof of a business requirement: check the
  requirement's status in `docs/requirements.md` before relying on behaviour
  the code already has.

## Security expectations

- All non-public endpoints require `JwtAuthGuard`. Check **authorization**
  (ownership / membership), not just authentication, on every resource access.
- Use the status codes the API design documents for each endpoint (e.g. 403
  for a Member viewing a board they don't belong to). Where the design is
  silent, ask (Q-28) rather than choosing.
- Validate and whitelist all input; reject unknown fields on sensitive DTOs.
- Hash passwords; never log or return passwords, hashes, tokens or secrets.
- Secrets come from environment variables only. `JWT_SECRET` must be set;
  do not add fallback default secrets.
- Use parameterized queries / ORM APIs only; no string-built SQL.
- Known issue: `app.module.ts` hard-codes placeholder `@nestjs/observe`
  credentials. Do not add real credentials there; move to env vars when
  approved.

## Testing expectations

- Every new endpoint has e2e coverage of: happy path, validation errors,
  unauthenticated access (401), and unauthorized access to another user's
  resources.
- Every service with logic has unit tests, including edge cases and error
  paths.
- Bug fixes start with a failing test that reproduces the bug.
- Tests must be deterministic and independent (no shared mutable state
  between tests, no reliance on execution order).
- Do not delete, skip or weaken existing tests to make a change pass.

## Ask for approval before

- Adding, removing or upgrading dependencies (including Prisma, Swagger).
- Creating or changing the database schema or migrations.
- Changing authentication/authorization behaviour or token format.
- Changing a public API contract (routes, request/response shapes, status
  codes) that already exists.
- Changing build, lint, test or TypeScript configuration.
- Large refactors, moving/renaming modules, or deleting files.
- Marking requirements as `Confirmed`, acknowledging assumptions, or
  answering open questions.
- Any `git commit`, `git push`, branch or history operation.
- Adding models to `prisma/schema.prisma` that differ from the sketch in
  `docs/architecture.md` §3.2.1 or from decisions D-15, D-19, D-20.
