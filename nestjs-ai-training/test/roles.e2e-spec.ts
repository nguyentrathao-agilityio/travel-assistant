import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { AuthModule } from './../src/auth/auth.module.js';
import type { JwtPayload } from './../src/auth/jwt-payload.js';
import { configureApp } from './../src/configure-app.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { Role } from './../src/users/role.enum.js';
import { ProtectedTestController } from './fixtures/protected.controller.js';
import { resetDatabase } from './utils/database.js';

describe('Authentication and roles (e2e)', () => {
  let app: INestApplication<App>;

  const member = {
    username: 'alice',
    email: 'alice@example.com',
    password: 'password123',
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, AuthModule],
      controllers: [ProtectedTestController],
    }).compile();

    app = configureApp(moduleFixture.createNestApplication());
    await app.init();
    await resetDatabase(app.get(PrismaService));
  });

  afterEach(async () => {
    await app.close();
  });

  const registerMember = async (): Promise<string> => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(member)
      .expect(201);
    return res.body.access as string;
  };

  const get = (path: string, token?: string) => {
    const req = request(app.getHttpServer()).get(
      `/api/v1/test-protected/${path}`,
    );
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };

  const adminPayload: JwtPayload = {
    sub: '00000000-0000-0000-0000-000000000001',
    email: 'admin@example.com',
    role: Role.ADMIN,
  };

  describe('authenticated endpoint', () => {
    it('accepts the token returned by register', async () => {
      const res = await get('any', await registerMember()).expect(200);

      expect(res.body.data).toMatchObject({
        email: member.email,
        role: 'MEMBER',
      });
    });

    it('returns 401 without a token', async () => {
      await get('any').expect(401);
    });

    it('returns 401 for a non-Bearer scheme', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/test-protected/any')
        .set('Authorization', 'Basic abc123')
        .expect(401);
    });

    it('returns 401 for a tampered token', async () => {
      await get('any', 'not.a.valid-token').expect(401);
    });

    it('returns 401 for a token signed with another secret', async () => {
      const token = await new JwtService({ secret: 'other-secret' }).signAsync(
        adminPayload,
      );

      await get('any', token).expect(401);
    });

    it('returns 401 for an expired token', async () => {
      const token = await app
        .get(JwtService)
        .signAsync(adminPayload, { expiresIn: -60 });

      await get('any', token).expect(401);
    });
  });

  describe('Admin-only endpoint', () => {
    it('returns 403 FORBIDDEN for a Member token', async () => {
      const res = await get('admin', await registerMember()).expect(403);

      expect(res.body).toEqual({
        errors: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action',
        },
      });
    });

    it('allows an Admin token', async () => {
      const token = await app.get(JwtService).signAsync(adminPayload);

      const res = await get('admin', token).expect(200);
      expect(res.body).toEqual({ data: 'ok' });
    });

    it('returns 401, not 403, without a token', async () => {
      await get('admin').expect(401);
    });
  });

  describe('access token', () => {
    it('expires after one hour and carries { sub, email, role }', async () => {
      const token = await registerMember();
      const payload = app
        .get(JwtService)
        .decode<JwtPayload & { iat: number; exp: number }>(token);

      expect(payload.exp - payload.iat).toBe(3600);
      expect(payload).toMatchObject({ email: member.email, role: 'MEMBER' });
      expect(typeof payload.sub).toBe('string');
    });
  });
});
