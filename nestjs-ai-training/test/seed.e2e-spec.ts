import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { AuthModule } from './../src/auth/auth.module.js';
import { PasswordHasherService } from './../src/auth/password-hasher.service.js';
import { configureApp } from './../src/configure-app.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { readAdminSeedConfig, seedAdmin } from './../src/seed/seed-admin.js';
import { Role } from './../src/users/role.enum.js';
import { UsersService } from './../src/users/users.service.js';
import { ProtectedTestController } from './fixtures/protected.controller.js';
import { resetDatabase } from './utils/database.js';

describe('Admin seed (e2e)', () => {
  let app: INestApplication<App>;

  const config = readAdminSeedConfig({
    ADMIN_USERNAME: 'admin',
    ADMIN_EMAIL: 'admin@example.com',
    ADMIN_PASSWORD: 'admin-password',
  });

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

  const seed = () =>
    seedAdmin(app.get(UsersService), new PasswordHasherService(), config);

  it('creates exactly one Admin when run twice', async () => {
    await expect(seed()).resolves.toBe('created');
    await expect(seed()).resolves.toBe('exists');

    await expect(
      app.get(PrismaService).user.count({ where: { role: Role.ADMIN } }),
    ).resolves.toBe(1);
  });

  it('lets the seeded Admin log in and use Admin-only routes', async () => {
    await seed();

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: config.email, password: config.password })
      .expect(200);
    expect(res.body.data.role).toBe('ADMIN');

    await request(app.getHttpServer())
      .get('/api/v1/test-protected/admin')
      .set('Authorization', `Bearer ${res.body.access}`)
      .expect(200);
  });
});
