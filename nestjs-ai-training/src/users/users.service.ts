import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { Role } from './role.enum.js';
import type { User } from './user.entity.js';

export interface CreateUserInput {
  username: string;
  email: string;
  passwordHash: string;
  // Server-side only (Admin seed); registration never sets it.
  role?: Role;
}

// Emails are stored lowercased; usernames are case-sensitive.
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserInput): Promise<User> {
    try {
      return await this.prisma.user.create({
        data: {
          username: input.username,
          email: input.email.toLowerCase(),
          passwordHash: input.passwordHash,
          role: input.role,
        },
      });
    } catch (error) {
      // Unique constraint hit, e.g. a concurrent registration.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Username or email is already registered');
      }
      throw error;
    }
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }
}
