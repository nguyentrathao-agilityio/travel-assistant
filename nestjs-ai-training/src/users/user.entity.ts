import type { User } from '../generated/prisma/client.js';

export type { User };

export type PublicUser = Omit<User, 'passwordHash'>;

export function toPublicUser(user: User): PublicUser {
  const { id, username, email, role, createdAt, updatedAt } = user;
  return { id, username, email, role, createdAt, updatedAt };
}
