import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/configure-app.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { Role } from './../src/users/role.enum.js';
import { resetDatabase } from './utils/database.js';

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';

describe('Boards (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminId: string;
  let adminToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = configureApp(moduleFixture.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);
    await resetDatabase(prisma);

    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@example.com',
        passwordHash: 'not-used',
        role: Role.ADMIN,
      },
    });
    adminId = admin.id;
    adminToken = await app.get(JwtService).signAsync({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    });
  });

  afterEach(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  const registerMember = async (
    username = 'alice',
  ): Promise<{ id: string; token: string }> => {
    const res = await http()
      .post('/api/v1/auth/register')
      .send({
        username,
        email: `${username}@example.com`,
        password: 'password123',
      })
      .expect(201);
    return { id: res.body.data.id as string, token: res.body.access as string };
  };

  const insertBoard = (
    name: string,
    extra: { createdAt?: Date; deletedAt?: Date } = {},
  ) =>
    prisma.board.create({
      data: { name, createdById: adminId, ...extra },
    });

  const addMember = (boardId: string, userId: string) =>
    prisma.boardMember.create({ data: { boardId, userId } });

  describe('POST /boards', () => {
    it('lets an Admin create a board (201) without adding them as a member', async () => {
      const res = await http()
        .post('/api/v1/boards')
        .set(auth(adminToken))
        .send({ name: 'Project A', description: 'Sprint planning' })
        .expect(201);

      expect(res.body).toEqual({
        data: {
          id: expect.any(String),
          name: 'Project A',
          description: 'Sprint planning',
          createdBy: adminId,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          deletedAt: null,
        },
      });
      expect(await prisma.boardMember.count()).toBe(0);
    });

    it('accepts a board without a description', async () => {
      const res = await http()
        .post('/api/v1/boards')
        .set(auth(adminToken))
        .send({ name: 'Project A' })
        .expect(201);

      expect(res.body.data.description).toBeNull();
    });

    it('allows duplicate names (no 409)', async () => {
      for (let i = 0; i < 2; i++) {
        await http()
          .post('/api/v1/boards')
          .set(auth(adminToken))
          .send({ name: 'Same name' })
          .expect(201);
      }
    });

    it('ignores server-controlled fields in the body', async () => {
      const res = await http()
        .post('/api/v1/boards')
        .set(auth(adminToken))
        .send({
          name: 'Project A',
          id: UNKNOWN_ID,
          createdBy: UNKNOWN_ID,
          deletedAt: '2026-01-01T00:00:00Z',
        })
        .expect(201);

      expect(res.body.data.id).not.toBe(UNKNOWN_ID);
      expect(res.body.data.createdBy).toBe(adminId);
      expect(res.body.data.deletedAt).toBeNull();
    });

    it.each([
      ['missing name', { description: 'x' }],
      ['blank name', { name: '   ' }],
      ['non-string name', { name: 42 }],
      ['non-string description', { name: 'A', description: 42 }],
    ])('returns 400 VALIDATION_FAILED for %s', async (_case, body) => {
      const res = await http()
        .post('/api/v1/boards')
        .set(auth(adminToken))
        .send(body)
        .expect(400);

      expect(res.body.errors.code).toBe('VALIDATION_FAILED');
    });

    it('returns 403 for a Member', async () => {
      const { token } = await registerMember();

      await http()
        .post('/api/v1/boards')
        .set(auth(token))
        .send({ name: 'Project A' })
        .expect(403);
    });

    it('returns 401 without a token', async () => {
      await http().post('/api/v1/boards').send({ name: 'A' }).expect(401);
    });
  });

  describe('GET /boards', () => {
    it('returns 10 boards by default, newest first, with meta', async () => {
      for (let i = 1; i <= 12; i++) {
        await insertBoard(`Board ${i}`, {
          createdAt: new Date(Date.UTC(2026, 0, i)),
        });
      }

      const res = await http()
        .get('/api/v1/boards')
        .set(auth(adminToken))
        .expect(200);

      expect(res.body.meta).toEqual({
        total: 12,
        totalPages: 2,
        limit: 10,
        page: 1,
      });
      expect(res.body.data.map((b: { name: string }) => b.name)).toEqual([
        'Board 12',
        'Board 11',
        'Board 10',
        'Board 9',
        'Board 8',
        'Board 7',
        'Board 6',
        'Board 5',
        'Board 4',
        'Board 3',
      ]);
    });

    it('pages with page and limit', async () => {
      for (let i = 1; i <= 5; i++) {
        await insertBoard(`Board ${i}`, {
          createdAt: new Date(Date.UTC(2026, 0, i)),
        });
      }

      const res = await http()
        .get('/api/v1/boards?page=2&limit=2')
        .set(auth(adminToken))
        .expect(200);

      expect(res.body.meta).toEqual({
        total: 5,
        totalPages: 3,
        limit: 2,
        page: 2,
      });
      expect(res.body.data.map((b: { name: string }) => b.name)).toEqual([
        'Board 3',
        'Board 2',
      ]);
    });

    it('searches names with a case-insensitive partial match', async () => {
      await insertBoard('Project A');
      await insertBoard('My PROJECT');
      await insertBoard('Other');

      const res = await http()
        .get('/api/v1/boards?search=project')
        .set(auth(adminToken))
        .expect(200);

      expect(res.body.data.map((b: { name: string }) => b.name).sort()).toEqual(
        ['My PROJECT', 'Project A'],
      );
      expect(res.body.meta.total).toBe(2);
    });

    it('shows an Admin all non-archived boards', async () => {
      await insertBoard('A');
      await insertBoard('B');
      await insertBoard('Archived', { deletedAt: new Date() });

      const res = await http()
        .get('/api/v1/boards')
        .set(auth(adminToken))
        .expect(200);

      expect(res.body.data.map((b: { name: string }) => b.name).sort()).toEqual(
        ['A', 'B'],
      );
    });

    it('shows a Member only their non-archived boards', async () => {
      const alice = await registerMember();
      const a = await insertBoard('Board A');
      await insertBoard('Board B');
      const archived = await insertBoard('Archived', { deletedAt: new Date() });
      await addMember(a.id, alice.id);
      await addMember(archived.id, alice.id);

      const res = await http()
        .get('/api/v1/boards')
        .set(auth(alice.token))
        .expect(200);

      expect(res.body.data.map((b: { name: string }) => b.name)).toEqual([
        'Board A',
      ]);
      expect(res.body.meta.total).toBe(1);
    });

    it('does not reveal other boards to a Member through search', async () => {
      const alice = await registerMember();
      const a = await insertBoard('Project A');
      await insertBoard('Project B');
      await addMember(a.id, alice.id);

      const res = await http()
        .get('/api/v1/boards?search=project')
        .set(auth(alice.token))
        .expect(200);

      expect(res.body.data.map((b: { name: string }) => b.name)).toEqual([
        'Project A',
      ]);
    });

    it.each(['limit=0', 'limit=101', 'limit=abc', 'page=0', 'page=1.5'])(
      'returns 400 VALIDATION_FAILED for %s',
      async (query) => {
        const res = await http()
          .get(`/api/v1/boards?${query}`)
          .set(auth(adminToken))
          .expect(400);

        expect(res.body.errors.code).toBe('VALIDATION_FAILED');
      },
    );

    it('accepts limit=100', async () => {
      await http()
        .get('/api/v1/boards?limit=100')
        .set(auth(adminToken))
        .expect(200);
    });

    it('returns 401 without a token', async () => {
      await http().get('/api/v1/boards').expect(401);
    });
  });

  describe('GET /boards/:id', () => {
    it('returns the board to an Admin', async () => {
      const board = await insertBoard('Project A');

      const res = await http()
        .get(`/api/v1/boards/${board.id}`)
        .set(auth(adminToken))
        .expect(200);

      expect(res.body.data).toMatchObject({ id: board.id, name: 'Project A' });
    });

    it('returns the board to a Member who belongs to it', async () => {
      const alice = await registerMember();
      const board = await insertBoard('Project A');
      await addMember(board.id, alice.id);

      await http()
        .get(`/api/v1/boards/${board.id}`)
        .set(auth(alice.token))
        .expect(200);
    });

    it('returns 403 to a Member who does not belong to the board', async () => {
      const alice = await registerMember();
      const board = await insertBoard('Project B');

      const res = await http()
        .get(`/api/v1/boards/${board.id}`)
        .set(auth(alice.token))
        .expect(403);

      expect(res.body.errors.code).toBe('FORBIDDEN');
    });

    it('returns 404 for an unknown board (Admin and Member)', async () => {
      const alice = await registerMember();

      for (const token of [adminToken, alice.token]) {
        const res = await http()
          .get(`/api/v1/boards/${UNKNOWN_ID}`)
          .set(auth(token))
          .expect(404);
        expect(res.body.errors.code).toBe('NOT_FOUND');
      }
    });

    it('returns 404 for an archived board, even to an Admin or a member of it', async () => {
      const alice = await registerMember();
      const board = await insertBoard('Old', { deletedAt: new Date() });
      await addMember(board.id, alice.id);

      for (const token of [adminToken, alice.token]) {
        await http()
          .get(`/api/v1/boards/${board.id}`)
          .set(auth(token))
          .expect(404);
      }
    });

    it('returns 400 VALIDATION_FAILED for a malformed id', async () => {
      const res = await http()
        .get('/api/v1/boards/not-a-uuid')
        .set(auth(adminToken))
        .expect(400);

      expect(res.body.errors.code).toBe('VALIDATION_FAILED');
    });

    it('returns 401 without a token', async () => {
      await http().get(`/api/v1/boards/${UNKNOWN_ID}`).expect(401);
    });
  });

  describe('PATCH /boards/:id', () => {
    it('lets an Admin update name and description', async () => {
      const board = await insertBoard('Project A');

      const res = await http()
        .patch(`/api/v1/boards/${board.id}`)
        .set(auth(adminToken))
        .send({ name: 'Renamed', description: 'Updated' })
        .expect(200);

      expect(res.body.data).toMatchObject({
        id: board.id,
        name: 'Renamed',
        description: 'Updated',
      });
    });

    it('updates only the fields that are sent', async () => {
      const board = await prisma.board.create({
        data: {
          name: 'Project A',
          description: 'Keep me',
          createdById: adminId,
        },
      });

      const res = await http()
        .patch(`/api/v1/boards/${board.id}`)
        .set(auth(adminToken))
        .send({ name: 'Renamed' })
        .expect(200);

      expect(res.body.data).toMatchObject({
        name: 'Renamed',
        description: 'Keep me',
      });
    });

    it('cannot change anything but name and description', async () => {
      const alice = await registerMember();
      const board = await insertBoard('Project A');

      const res = await http()
        .patch(`/api/v1/boards/${board.id}`)
        .set(auth(adminToken))
        .send({
          id: UNKNOWN_ID,
          createdBy: alice.id,
          createdById: alice.id,
          deletedAt: '2026-01-01T00:00:00Z',
          createdAt: '2020-01-01T00:00:00Z',
        })
        .expect(200);

      const stored = await prisma.board.findUniqueOrThrow({
        where: { id: board.id },
      });
      expect(stored).toMatchObject({
        id: board.id,
        name: 'Project A',
        createdById: adminId,
        deletedAt: null,
        createdAt: board.createdAt,
      });
      expect(res.body.data.createdBy).toBe(adminId);
    });

    it.each([
      ['blank name', { name: '' }],
      ['null name', { name: null }],
      ['non-string description', { description: 42 }],
    ])('returns 400 VALIDATION_FAILED for %s', async (_case, body) => {
      const board = await insertBoard('Project A');

      const res = await http()
        .patch(`/api/v1/boards/${board.id}`)
        .set(auth(adminToken))
        .send(body)
        .expect(400);

      expect(res.body.errors.code).toBe('VALIDATION_FAILED');
    });

    it('allows duplicate names (no 409)', async () => {
      await insertBoard('Taken');
      const board = await insertBoard('Project A');

      await http()
        .patch(`/api/v1/boards/${board.id}`)
        .set(auth(adminToken))
        .send({ name: 'Taken' })
        .expect(200);
    });

    it('returns 404 for an unknown or archived board', async () => {
      const archived = await insertBoard('Old', { deletedAt: new Date() });

      for (const id of [UNKNOWN_ID, archived.id]) {
        await http()
          .patch(`/api/v1/boards/${id}`)
          .set(auth(adminToken))
          .send({ name: 'Renamed' })
          .expect(404);
      }
    });

    it('returns 400 for a malformed id', async () => {
      await http()
        .patch('/api/v1/boards/not-a-uuid')
        .set(auth(adminToken))
        .send({ name: 'Renamed' })
        .expect(400);
    });

    it('returns 403 for a Member, even one who belongs to the board', async () => {
      const alice = await registerMember();
      const board = await insertBoard('Project A');
      await addMember(board.id, alice.id);

      await http()
        .patch(`/api/v1/boards/${board.id}`)
        .set(auth(alice.token))
        .send({ name: 'Renamed' })
        .expect(403);
    });

    it('returns 401 without a token', async () => {
      await http()
        .patch(`/api/v1/boards/${UNKNOWN_ID}`)
        .send({ name: 'Renamed' })
        .expect(401);
    });
  });

  describe('DELETE /boards/:id', () => {
    it('archives the board (204) without removing the row', async () => {
      const board = await insertBoard('Project A');

      const res = await http()
        .delete(`/api/v1/boards/${board.id}`)
        .set(auth(adminToken))
        .expect(204);

      expect(res.body).toEqual({});
      const stored = await prisma.board.findUnique({ where: { id: board.id } });
      expect(stored?.deletedAt).toBeInstanceOf(Date);
    });

    it('hides the archived board from lists and detail', async () => {
      const board = await insertBoard('Project A');

      await http()
        .delete(`/api/v1/boards/${board.id}`)
        .set(auth(adminToken))
        .expect(204);

      const list = await http()
        .get('/api/v1/boards')
        .set(auth(adminToken))
        .expect(200);
      expect(list.body.data).toEqual([]);
      await http()
        .get(`/api/v1/boards/${board.id}`)
        .set(auth(adminToken))
        .expect(404);
    });

    it('returns 404 for an unknown or already archived board', async () => {
      const archived = await insertBoard('Old', { deletedAt: new Date() });

      for (const id of [UNKNOWN_ID, archived.id]) {
        await http()
          .delete(`/api/v1/boards/${id}`)
          .set(auth(adminToken))
          .expect(404);
      }
    });

    it('returns 400 for a malformed id', async () => {
      await http()
        .delete('/api/v1/boards/not-a-uuid')
        .set(auth(adminToken))
        .expect(400);
    });

    it('returns 403 for a Member', async () => {
      const alice = await registerMember();
      const board = await insertBoard('Project A');
      await addMember(board.id, alice.id);

      await http()
        .delete(`/api/v1/boards/${board.id}`)
        .set(auth(alice.token))
        .expect(403);
      const stored = await prisma.board.findUnique({ where: { id: board.id } });
      expect(stored?.deletedAt).toBeNull();
    });

    it('returns 401 without a token', async () => {
      await http().delete(`/api/v1/boards/${UNKNOWN_ID}`).expect(401);
    });
  });
});
