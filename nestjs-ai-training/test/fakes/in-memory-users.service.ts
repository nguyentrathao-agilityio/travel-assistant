import { ConflictException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Role } from '../../src/users/role.enum.js';
import type { User } from '../../src/users/user.entity.js';
import type {
  CreateUserInput,
  UsersService,
} from '../../src/users/users.service.js';

// Database-free stand-in for UsersService in unit tests. Mirrors the real
// rules: email stored lowercased and unique, username unique and
// case-sensitive.
export class InMemoryUsersService implements Pick<
  UsersService,
  'create' | 'findById' | 'findByEmail' | 'findByUsername'
> {
  private readonly users = new Map<string, User>();

  async create(input: CreateUserInput): Promise<User> {
    const email = input.email.toLowerCase();
    if (
      (await this.findByEmail(email)) ||
      (await this.findByUsername(input.username))
    ) {
      throw new ConflictException('Username or email is already registered');
    }
    const now = new Date();
    const user: User = {
      id: randomUUID(),
      username: input.username,
      email,
      passwordHash: input.passwordHash,
      role: input.role ?? Role.MEMBER,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.toLowerCase();
    return [...this.users.values()].find((u) => u.email === normalized) ?? null;
  }

  async findByUsername(username: string): Promise<User | null> {
    return (
      [...this.users.values()].find((u) => u.username === username) ?? null
    );
  }
}
