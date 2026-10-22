import { ConflictException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { Role } from './role.enum.js';
import { UsersService } from './users.service.js';

function uniqueViolation(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
  });
}

// Minimal stand-in for `prisma.user` that records the arguments it receives.
function createPrismaStub() {
  const calls = { create: [] as unknown[], findUnique: [] as unknown[] };
  const results: { create: () => Promise<unknown> } = {
    create: () => Promise.resolve({ id: '1' }),
  };
  const prisma = {
    user: {
      create: (args: unknown) => {
        calls.create.push(args);
        return results.create();
      },
      findUnique: (args: unknown) => {
        calls.findUnique.push(args);
        return Promise.resolve(null);
      },
    },
  } as unknown as PrismaService;
  return { prisma, calls, results };
}

describe('UsersService', () => {
  let stub: ReturnType<typeof createPrismaStub>;
  let service: UsersService;

  beforeEach(() => {
    stub = createPrismaStub();
    service = new UsersService(stub.prisma);
  });

  describe('create', () => {
    it('stores the email lowercased and keeps the username as given', async () => {
      await service.create({
        username: 'Alice',
        email: 'Alice@Example.com',
        passwordHash: 'hash',
      });

      expect(stub.calls.create).toEqual([
        {
          data: {
            username: 'Alice',
            email: 'alice@example.com',
            passwordHash: 'hash',
          },
        },
      ]);
    });

    it('passes an explicit role through', async () => {
      await service.create({
        username: 'root',
        email: 'root@example.com',
        passwordHash: 'hash',
        role: Role.ADMIN,
      });

      expect(stub.calls.create).toEqual([
        {
          data: {
            username: 'root',
            email: 'root@example.com',
            passwordHash: 'hash',
            role: Role.ADMIN,
          },
        },
      ]);
    });

    it('turns a unique-constraint violation into 409 Conflict', async () => {
      stub.results.create = () => Promise.reject(uniqueViolation());

      await expect(
        service.create({ username: 'a', email: 'a@x.io', passwordHash: 'h' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows other errors', async () => {
      const failure = new Error('connection lost');
      stub.results.create = () => Promise.reject(failure);

      await expect(
        service.create({ username: 'a', email: 'a@x.io', passwordHash: 'h' }),
      ).rejects.toBe(failure);
    });
  });

  it('looks up emails lowercased', async () => {
    await service.findByEmail('Alice@Example.com');

    expect(stub.calls.findUnique).toEqual([
      { where: { email: 'alice@example.com' } },
    ]);
  });

  it('looks up usernames case-sensitively', async () => {
    await service.findByUsername('Alice');

    expect(stub.calls.findUnique).toEqual([{ where: { username: 'Alice' } }]);
  });

  it('looks up users by id', async () => {
    await expect(service.findById('42')).resolves.toBeNull();
    expect(stub.calls.findUnique).toEqual([{ where: { id: '42' } }]);
  });
});
