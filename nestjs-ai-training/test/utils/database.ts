import type { PrismaService } from '../../src/prisma/prisma.service.js';

// Empties every application table so e2e tests do not depend on each other.
// Refuses to run unless DATABASE_URL points at a *_test database.
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  const databaseName = new URL(process.env.DATABASE_URL ?? '').pathname;
  if (!databaseName.endsWith('_test')) {
    throw new Error(
      `Refusing to reset "${databaseName}": e2e tests need a *_test database`,
    );
  }

  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tables.length === 0) return;

  // Table names come from the catalog above, not from user input.
  const list = tables.map(({ tablename }) => `"public"."${tablename}"`);
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${list.join(', ')} RESTART IDENTITY CASCADE`,
  );
}
