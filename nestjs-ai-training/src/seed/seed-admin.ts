import { isEmail } from 'class-validator';
import type { PasswordHasherService } from '../auth/password-hasher.service.js';
import { Role } from '../users/role.enum.js';
import type { UsersService } from '../users/users.service.js';

export interface AdminSeedConfig {
  username: string;
  email: string;
  password: string;
}

const REQUIRED = ['ADMIN_USERNAME', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'] as const;
const MIN_PASSWORD_LENGTH = 8;

// Reads the Admin credentials from the environment; no defaults.
export function readAdminSeedConfig(env: NodeJS.ProcessEnv): AdminSeedConfig {
  const missing = REQUIRED.filter((name) => !env[name]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  const email = env.ADMIN_EMAIL!.trim().toLowerCase();
  if (!isEmail(email)) {
    throw new Error('ADMIN_EMAIL must be a valid email address');
  }

  const password = env.ADMIN_PASSWORD!;
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
  }

  return {
    username: env.ADMIN_USERNAME!.trim(),
    email,
    password,
  };
}

// Creates the Admin once. Re-running is a no-op and never resets the
// password; an existing non-admin user with the same email is an error.
export async function seedAdmin(
  users: Pick<UsersService, 'findByEmail' | 'create'>,
  hasher: Pick<PasswordHasherService, 'hash'>,
  config: AdminSeedConfig,
): Promise<'created' | 'exists'> {
  const existing = await users.findByEmail(config.email);
  if (existing) {
    if (existing.role !== Role.ADMIN) {
      throw new Error('ADMIN_EMAIL belongs to an existing non-admin user');
    }

    return 'exists';
  }

  await users.create({
    username: config.username,
    email: config.email,
    passwordHash: await hasher.hash(config.password),
    role: Role.ADMIN,
  });
  return 'created';
}
