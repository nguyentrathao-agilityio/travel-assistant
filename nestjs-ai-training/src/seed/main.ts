import { PasswordHasherService } from '../auth/password-hasher.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { readAdminSeedConfig, seedAdmin } from './seed-admin.js';

// `pnpm db:seed`: validates the env before connecting, never logs credentials.
const config = readAdminSeedConfig(process.env);
const prisma = new PrismaService();
try {
  const result = await seedAdmin(
    new UsersService(prisma),
    new PasswordHasherService(),
    config,
  );
  console.log(result === 'created' ? 'Admin created' : 'Admin already exists');
} finally {
  await prisma.$disconnect();
}
