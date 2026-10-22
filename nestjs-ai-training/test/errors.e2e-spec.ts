import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { AuthModule } from './../src/auth/auth.module.js';
import { configureApp } from './../src/configure-app.js';
import { ProtectedTestController } from './fixtures/protected.controller.js';

// Test-only route to exercise the 500 path.
@Controller('test-errors')
class ThrowingController {
  @Get('boom')
  boom(): never {
    throw new Error('secret internal detail');
  }
}

describe('API conventions (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, AuthModule],
      controllers: [ThrowingController, ProtectedTestController],
    }).compile();

    app = configureApp(moduleFixture.createNestApplication());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/api/v1 prefix', () => {
    it('serves routes under /api/v1', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' })
        .expect(401);
    });

    it('returns 404 NOT_FOUND without the prefix', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' })
        .expect(404);

      expect(res.body.errors.code).toBe('NOT_FOUND');
    });

    it('returns 404 NOT_FOUND for GET /api/v1', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1').expect(404);

      expect(res.body.errors.code).toBe('NOT_FOUND');
    });
  });

  describe('error envelope', () => {
    it('returns 400 VALIDATION_FAILED with field details', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ username: 'alice', email: 'not-an-email', password: 'x' })
        .expect(400);

      expect(res.body).toEqual({
        errors: {
          code: 'VALIDATION_FAILED',
          message: 'The provided data is invalid.',
          details: expect.arrayContaining([
            { field: 'email', description: expect.any(String) },
            { field: 'password', description: expect.any(String) },
          ]),
        },
      });
    });

    it('returns 400 BAD_REQUEST for malformed JSON', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": ')
        .expect(400);

      expect(res.body.errors.code).toBe('BAD_REQUEST');
      expect(res.body.errors).not.toHaveProperty('details');
    });

    it('returns 401 UNAUTHORIZED with the documented message', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/test-protected/any')
        .expect(401);

      expect(res.body).toEqual({
        errors: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid JWT token',
        },
      });
    });

    it('returns 404 NOT_FOUND for unknown routes', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/does-not-exist')
        .expect(404);

      expect(res.body.errors.code).toBe('NOT_FOUND');
    });

    it('returns a generic 500 without internal details', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/test-errors/boom')
        .expect(500);

      expect(res.body).toEqual({
        errors: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal Server Error',
        },
      });
      expect(JSON.stringify(res.body)).not.toContain('secret');
    });
  });
});
