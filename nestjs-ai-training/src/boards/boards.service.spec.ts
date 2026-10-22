import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { JwtPayload } from '../auth/jwt-payload.js';
import type { Board } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '../users/role.enum.js';
import { toPublicBoard } from './board.entity.js';
import { BoardsService } from './boards.service.js';

const admin: JwtPayload = {
  sub: '00000000-0000-0000-0000-00000000000a',
  email: 'admin@example.com',
  role: Role.ADMIN,
};

const member: JwtPayload = {
  sub: '00000000-0000-0000-0000-00000000000b',
  email: 'member@example.com',
  role: Role.MEMBER,
};

function makeBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Project A',
    description: 'Sprint planning',
    createdById: admin.sub,
    deletedAt: null,
    createdAt: new Date('2026-10-01T00:00:00Z'),
    updatedAt: new Date('2026-10-02T00:00:00Z'),
    ...overrides,
  };
}

// Minimal stand-in for the Prisma calls BoardsService makes; records arguments.
function createPrismaStub() {
  const calls = {
    count: [] as unknown[],
    findMany: [] as unknown[],
    findFirst: [] as unknown[],
    create: [] as unknown[],
    update: [] as unknown[],
    memberFindUnique: [] as unknown[],
  };
  const state = {
    boards: [] as Board[],
    total: 0,
    found: null as Board | null,
    isMember: false,
  };
  const prisma = {
    $transaction: (operations: Promise<unknown>[]) => Promise.all(operations),
    board: {
      count: (args: unknown) => {
        calls.count.push(args);
        return Promise.resolve(state.total);
      },
      findMany: (args: unknown) => {
        calls.findMany.push(args);
        return Promise.resolve(state.boards);
      },
      findFirst: (args: unknown) => {
        calls.findFirst.push(args);
        return Promise.resolve(state.found);
      },
      create: (args: { data: Partial<Board> }) => {
        calls.create.push(args);
        return Promise.resolve(makeBoard(args.data));
      },
      update: (args: { data: Partial<Board> }) => {
        calls.update.push(args);
        return Promise.resolve(makeBoard({ ...state.found, ...args.data }));
      },
    },
    boardMember: {
      findUnique: (args: unknown) => {
        calls.memberFindUnique.push(args);
        return Promise.resolve(state.isMember ? { id: 'membership' } : null);
      },
    },
  } as unknown as PrismaService;
  return { prisma, calls, state };
}

describe('BoardsService', () => {
  let stub: ReturnType<typeof createPrismaStub>;
  let service: BoardsService;

  beforeEach(() => {
    stub = createPrismaStub();
    service = new BoardsService(stub.prisma);
  });

  describe('list', () => {
    it('shows an Admin every non-archived board, newest first', async () => {
      stub.state.boards = [makeBoard()];
      stub.state.total = 1;

      const result = await service.list(admin, { page: 1, limit: 10 });

      expect(stub.calls.findMany).toEqual([
        {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 10,
        },
      ]);
      expect(stub.calls.count).toEqual([{ where: { deletedAt: null } }]);
      expect(result).toEqual({
        meta: { total: 1, totalPages: 1, limit: 10, page: 1 },
        data: [toPublicBoard(makeBoard())],
      });
    });

    it('limits a Member to the boards they belong to', async () => {
      await service.list(member, { page: 1, limit: 10 });

      expect(stub.calls.count).toEqual([
        {
          where: {
            deletedAt: null,
            members: { some: { userId: member.sub } },
          },
        },
      ]);
    });

    it('searches names with a case-insensitive partial match', async () => {
      await service.list(member, { search: 'proj', page: 1, limit: 10 });

      expect(stub.calls.count).toEqual([
        {
          where: {
            deletedAt: null,
            name: { contains: 'proj', mode: 'insensitive' },
            members: { some: { userId: member.sub } },
          },
        },
      ]);
    });

    it('ignores an empty search', async () => {
      await service.list(admin, { search: '', page: 1, limit: 10 });

      expect(stub.calls.count).toEqual([{ where: { deletedAt: null } }]);
    });

    it('skips the earlier pages', async () => {
      stub.state.total = 45;

      const result = await service.list(admin, { page: 3, limit: 20 });

      expect(stub.calls.findMany).toEqual([
        expect.objectContaining({ skip: 40, take: 20 }),
      ]);
      expect(result.meta).toEqual({
        total: 45,
        totalPages: 3,
        limit: 20,
        page: 3,
      });
    });
  });

  describe('findOne', () => {
    it('looks up only non-archived boards', async () => {
      stub.state.found = makeBoard();

      await service.findOne(admin, 'board-id');

      expect(stub.calls.findFirst).toEqual([
        { where: { id: 'board-id', deletedAt: null } },
      ]);
    });

    it('throws 404 when the board is missing or archived', async () => {
      await expect(service.findOne(admin, 'board-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns any board to an Admin without checking membership', async () => {
      stub.state.found = makeBoard();

      await expect(service.findOne(admin, 'board-id')).resolves.toEqual(
        toPublicBoard(makeBoard()),
      );
      expect(stub.calls.memberFindUnique).toEqual([]);
    });

    it('returns the board to a Member who belongs to it', async () => {
      stub.state.found = makeBoard();
      stub.state.isMember = true;

      await expect(service.findOne(member, 'board-id')).resolves.toEqual(
        toPublicBoard(makeBoard()),
      );
      expect(stub.calls.memberFindUnique).toEqual([
        {
          where: {
            boardId_userId: { boardId: makeBoard().id, userId: member.sub },
          },
        },
      ]);
    });

    it('throws 403 for a Member who does not belong to the board', async () => {
      stub.state.found = makeBoard();

      await expect(service.findOne(member, 'board-id')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('throws 404 (not 403) to a Member for a missing board', async () => {
      await expect(service.findOne(member, 'board-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('records the Admin as creator and does not add them as a member', async () => {
      const board = await service.create(admin, {
        name: 'Project A',
        description: 'Sprint planning',
      });

      expect(stub.calls.create).toEqual([
        {
          data: {
            name: 'Project A',
            description: 'Sprint planning',
            createdById: admin.sub,
          },
        },
      ]);
      expect(board.createdBy).toBe(admin.sub);
    });
  });

  describe('update', () => {
    it('changes only name and description', async () => {
      stub.state.found = makeBoard();

      const board = await service.update('board-id', {
        name: 'Renamed',
        description: 'New',
      });

      expect(stub.calls.update).toEqual([
        {
          where: { id: makeBoard().id },
          data: { name: 'Renamed', description: 'New' },
        },
      ]);
      expect(board.name).toBe('Renamed');
    });

    it('throws 404 when the board is missing or archived', async () => {
      await expect(
        service.update('board-id', { name: 'Renamed' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(stub.calls.update).toEqual([]);
    });
  });

  describe('archive', () => {
    it('sets deletedAt instead of deleting the row', async () => {
      stub.state.found = makeBoard();

      await service.archive('board-id');

      expect(stub.calls.update).toEqual([
        {
          where: { id: makeBoard().id },
          data: { deletedAt: expect.any(Date) },
        },
      ]);
    });

    it('throws 404 when the board is missing or already archived', async () => {
      await expect(service.archive('board-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(stub.calls.update).toEqual([]);
    });
  });
});

describe('toPublicBoard', () => {
  it('exposes createdById as createdBy and keeps the designed fields', () => {
    expect(toPublicBoard(makeBoard())).toEqual({
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Project A',
      description: 'Sprint planning',
      createdBy: admin.sub,
      createdAt: new Date('2026-10-01T00:00:00Z'),
      updatedAt: new Date('2026-10-02T00:00:00Z'),
      deletedAt: null,
    });
  });
});
