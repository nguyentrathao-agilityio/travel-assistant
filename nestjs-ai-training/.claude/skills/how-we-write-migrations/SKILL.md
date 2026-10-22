---
name: how-we-write-migrations
description: How the Trello-lite NestJS API changes its database: editing prisma/schema.prisma to the team's conventions (uuid ids, camelCase fields, snake_case table names via @@map, soft delete, indexes, relations), generating the migration with `prisma migrate dev --create-only`, reading and hand-fixing the SQL so no data is lost (renames, NOT NULL columns, drops), applying it and verifying. Use this whenever a task adds or changes a Prisma model, field, enum, index or relation, needs a new migration, says "add a table/column", "rename a column", "make X required", touches prisma/migrations, or implements a ticket with "Data / schema changes", even if the user never says "migration".
---

# How we write migrations

Schema changes in this repo are the hardest thing to undo. A migration that merged and ran somewhere is permanent history, and the data it drops is gone. So the workflow is: agree on the change, generate the SQL without running it, read it as if it were going to production, fix it by hand if needed, then apply and verify.

The app lives in `nestjs-ai-training/`; run every command from there.

## 0. Approval comes first

CLAUDE.md requires approval before creating or changing the schema or migrations. Before touching `schema.prisma`, check whether this change is already approved: the user said so in this conversation, or the ticket says something like "Plan: written and approved (schema)".

If it isn't approved, stop and present a short plan, then wait:

- the models, fields, enums, indexes and relations you would add or change, as a Prisma snippet
- what the SQL will do to existing data (new table only / adds a nullable column / renames / backfills / drops)
- how it compares with the sketch in `docs/architecture.md` §3.2.1 and the DB design in `docs/source/trello-lite-database-design.md`; flag every difference, because those need explicit sign-off

## 1. Sources of truth

Read these before designing anything. When they disagree, record a contradiction instead of choosing (see CLAUDE.md):

- `docs/source/trello-lite-database-design.md`: tables, columns, constraints (read-only)
- `docs/architecture.md` §3.2.1: the agreed Prisma sketch for every model
- `docs/requirements.md` §11: team decisions on naming, invitation tokens, membership rows and more
- the current `prisma/schema.prisma` and the existing migrations, which show the conventions in practice

## 2. Schema conventions

Follow what the existing models already do:

```prisma
model Board {
  id          String        @id @default(uuid()) @db.Uuid
  // Not unique.
  name        String
  description String?
  createdById String        @db.Uuid
  createdBy   User          @relation(fields: [createdById], references: [id])
  // Archived when set (soft delete).
  deletedAt   DateTime?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  members     BoardMember[]

  @@index([deletedAt, createdAt])
  @@map("boards")
}
```

- **Ids:** `String @id @default(uuid()) @db.Uuid`. Every foreign-key field is `String @db.Uuid` too, so the types match.
- **Names:** fields are camelCase in Prisma and in the database. Don't add `@map` unless the DB design fixes a column name, as with `passwordHash @map("password")`. Tables are snake_case plural through `@@map` (`users`, `boards`, `board_members`, `invitations`, `tasks`).
- **Foreign keys:** `<thing>Id` plus a named relation field. The DB design's `created_by` becomes `createdById` and `createdBy`.
- **Timestamps:** `createdAt DateTime @default(now())` on every table. Add `updatedAt DateTime @updatedAt` on tables whose rows change. Join tables like `board_members` only get `createdAt`.
- **Soft delete:** `deletedAt DateTime?` on tables the requirements archive (boards, tasks). Queries filter `deletedAt: null`; nothing is hard-deleted.
- **Enums:** codes in UPPER_SNAKE (`ADMIN`, `IN_PROGRESS`), never display labels.
- **Delete behaviour:**
  - Membership or join rows that mean nothing without their parent use `onDelete: Cascade`.
  - Ownership and history links (`createdBy`, `invitedBy`) keep the default (Restrict).
- **Constraints:** a business rule like "unique per board and user" or "single-use token" goes into the database as `@unique` or `@@unique`. Application code alone is not enough.
- **Indexes:**
  - Index what the services actually filter or sort on, for example `@@index([deletedAt, createdAt])` for "active, newest first" lists, and the `userId` side of membership lookups.
  - Don't add speculative indexes.
- **Comments:** one short line, and only where the reason isn't visible in the code ("Not unique.", "Archived when set (soft delete)."). Requirement IDs (D-xx, FR-…, Q-xx) go in docs, never in the schema.

## 3. Generate without applying

```bash
pnpm db:migrate --name <change_in_snake_case> --create-only
```

- `--create-only` writes `prisma/migrations/<timestamp>_<name>/migration.sql` and stops there, so you can review the SQL before anything runs.
- Name the migration after the change, for example `invitations`, `tasks`, `add_board_position`, `rename_board_description`. Look at the existing folder names (`init_users`, `boards`).
- Never use `prisma db push`. It changes the database without leaving a migration behind.
- If the change would lose data (a rename, a drop, a new required column on a table with rows), `migrate dev` refuses to run in a non-interactive shell, even with `--create-only`. In that case, write the migration yourself:

  ```bash
  npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script   # the SQL Prisma would generate
  mkdir prisma/migrations/$(date -u +%Y%m%d%H%M%S)_<name>                                       # real current UTC time, so the order stays right
  ```

  Save the fixed SQL from step 4 as `migration.sql` in that folder.

## 4. Read the SQL and fix it by hand

Prisma generates the end state, not a safe path to it. Read every statement and ask what it does to rows that already exist:

| Change | What Prisma generates | What we commit |
|---|---|---|
| Rename a field or table | `DROP COLUMN` + `ADD COLUMN`, which loses the data | Replace with `ALTER TABLE "t" RENAME COLUMN "old" TO "new";` (or `RENAME TO` for a table), and rename the matching index or constraint if its name includes the column |
| New required column on a table with rows | `ADD COLUMN ... NOT NULL`, which fails on existing rows | Add it nullable, backfill with an `UPDATE`, then `ALTER COLUMN ... SET NOT NULL`, all in this migration. A constant `DEFAULT` is enough only if one value really fits every existing row |
| Make an existing column required | `SET NOT NULL`, which fails if any row has NULL | Backfill the NULLs first, in the same migration |
| Drop a column or table | `DROP ...` | Only if the user explicitly confirmed losing that data. Otherwise stop and ask |
| Change a column's type | `DROP` + `ADD`, or a cast that may fail | `ALTER COLUMN ... TYPE ... USING <expression>`, and check the expression against real values |
| New unique constraint | `CREATE UNIQUE INDEX`, which fails if duplicates exist | Check for duplicates first and tell the user if any exist |

Example: making `position` required on `boards` while keeping the current order:

```sql
-- AlterTable
ALTER TABLE "boards" ADD COLUMN "position" INTEGER;

-- Backfill existing rows: oldest board first.
UPDATE "boards" SET "position" = sub.rn
FROM (SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt") AS rn FROM "boards") AS sub
WHERE "boards"."id" = sub."id";

ALTER TABLE "boards" ALTER COLUMN "position" SET NOT NULL;
```

Keep Prisma's `-- CreateTable` / `-- AlterTable` comment headers, and add a one-line comment above each statement you wrote by hand so a reviewer can see why it differs from the generated SQL.

## 5. Apply and verify

```bash
pnpm db:migrate              # applies the pending migration to DATABASE_URL
pnpm db:generate             # Prisma 7's migrate dev no longer regenerates the client; without this, code and tests see the old models
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
pnpm lint && pnpm test && pnpm test:e2e && pnpm build
```

- `migrate diff` compares the migrated database with `schema.prisma`. "No difference detected" (exit 0) means your hand-edited SQL produces exactly the schema. Exit 2 prints what is still different. Fix the migration while it's unmerged, don't paper over it with a second one.
- Don't use `migrate dev --create-only` as a sync check. When nothing changed, it still writes an empty migration folder.

- `pnpm test:e2e` applies every migration to `TEST_DATABASE_URL` through `migrate deploy` (`test/global-setup.ts`). A passing run proves the SQL works on a fresh database.
- For data-preserving changes, also check a database that already has rows: count the rows, or select the renamed or backfilled column, before and after.
- `resetDatabase()` truncates every table, so new tables need no test cleanup code. Unit tests stay database-free: update fakes or stubs if a model's shape changed.

## 6. Rules for migration history

- **Never edit a migration that is committed on a shared branch or merged.** Other databases have already run it, and Prisma would report a checksum mismatch. Write a new migration instead.
- You may edit or regenerate a migration only while it's still local and unmerged. Delete its folder, reset your local database, and generate it again.
- Never delete old migrations and never edit `migration_lock.toml`.
- Ask before running `prisma migrate reset` on any database you didn't create yourself. It drops all data.
- The schema change and its migration folder belong in the same commit. Don't commit unless the user asks.

## 7. Update docs and the ticket

- `docs/architecture.md` §3.2.1: keep the sketch matching the real model, and mark what is now implemented.
- The ticket's "Data / schema changes" section: name the migration folder and give a one-line summary of anything done by hand (rename, backfill).
- CLAUDE.md "Architecture": only if a new model or module was added.

## 8. Report

Tell the user:
- the migration folder name, the models and fields that changed, and any SQL you edited by hand and why
- what you ran and its results
- anything that still needs their decision, such as a drop that needs confirmation or duplicates found before adding a unique constraint
