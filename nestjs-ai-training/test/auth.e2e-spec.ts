import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/configure-app.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { resetDatabase } from './utils/database.js';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  const user = {
    username: 'alice',
    email: 'alice@example.com',
    password: 'password123',
  };

  const createApp = async (): Promise<INestApplication<App>> => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const instance = configureApp(moduleFixture.createNestApplication());
    await instance.init();
    return instance;
  };

  beforeEach(async () => {
    app = await createApp();
    await resetDatabase(app.get(PrismaService));
  });

  afterEach(async () => {
    await app.close();
  });

  const register = (body: object) =>
    request(app.getHttpServer()).post('/api/v1/auth/register').send(body);
  const login = (body: object) =>
    request(app.getHttpServer()).post('/api/v1/auth/login').send(body);

  describe('POST /auth/register', () => {
    it('returns 201 with the Member user and an access token', async () => {
      const res = await register(user).expect(201);

      expect(res.body).toEqual({
        data: {
          id: expect.any(String),
          username: 'alice',
          email: 'alice@example.com',
          role: 'MEMBER',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
        access: expect.any(String),
      });
    });

    it('returns the email lowercased', async () => {
      const res = await register({
        ...user,
        email: 'Alice@Example.COM',
      }).expect(201);

      expect(res.body.data.email).toBe('alice@example.com');
    });

    it('ignores a client-supplied role', async () => {
      const res = await register({ ...user, role: 'ADMIN' }).expect(201);

      expect(res.body.data.role).toBe('MEMBER');
    });

    it.each([
      ['missing username', { email: user.email, password: user.password }],
      ['missing email', { username: user.username, password: user.password }],
      ['missing password', { username: user.username, email: user.email }],
      ['malformed email', { ...user, email: 'not-an-email' }],
      ['short password', { ...user, password: 'short' }],
    ])('returns 400 for %s', async (_, body) => {
      await register(body).expect(400);
    });

    it('returns 409 for a duplicate email', async () => {
      await register(user).expect(201);
      await register({ ...user, username: 'bob' }).expect(409);
    });

    it('returns 409 for an email differing only in case', async () => {
      await register(user).expect(201);
      await register({
        ...user,
        username: 'bob',
        email: 'ALICE@Example.com',
      }).expect(409);
    });

    it('returns 409 for a duplicate username', async () => {
      await register(user).expect(201);
      await register({ ...user, email: 'other@example.com' }).expect(409);
    });

    it('treats usernames differing only in case as different', async () => {
      await register(user).expect(201);
      await register({
        ...user,
        username: 'Alice',
        email: 'other@example.com',
      }).expect(201);
    });

    it('stores a bcrypt hash, never the plain password', async () => {
      await register(user).expect(201);

      const stored = await app
        .get(PrismaService)
        .user.findUniqueOrThrow({ where: { email: user.email } });
      expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
      expect(stored.passwordHash).not.toContain(user.password);
    });

    it('keeps users after the app restarts', async () => {
      await register(user).expect(201);
      await app.close();

      app = await createApp();
      await login({ email: user.email, password: user.password }).expect(200);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await register(user).expect(201);
    });

    it('returns 200 with the user and an access token', async () => {
      const res = await login({
        email: user.email,
        password: user.password,
      }).expect(200);

      expect(res.body).toEqual({
        data: expect.objectContaining({ email: user.email, role: 'MEMBER' }),
        access: expect.any(String),
      });
      expect(res.body.data).not.toHaveProperty('passwordHash');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('returns 401 for a wrong password', async () => {
      await login({ email: user.email, password: 'wrong-pass' }).expect(401);
    });

    it('returns 401 for an unknown email', async () => {
      await login({
        email: 'nobody@example.com',
        password: user.password,
      }).expect(401);
    });
  });

  it('no longer serves GET /auth/me', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(404);
  });
});
