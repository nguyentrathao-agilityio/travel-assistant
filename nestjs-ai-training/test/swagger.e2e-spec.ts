import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { AuthModule } from './../src/auth/auth.module.js';
import { configureApp } from './../src/configure-app.js';
import { ProtectedTestController } from './fixtures/protected.controller.js';

describe('API documentation (e2e)', () => {
  let app: INestApplication<App> | undefined;

  const createApp = async (): Promise<INestApplication<App>> => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, AuthModule],
      controllers: [ProtectedTestController],
    }).compile();

    const instance = configureApp(moduleFixture.createNestApplication());
    await instance.init();
    return instance;
  };

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  describe('when enabled', () => {
    beforeEach(async () => {
      app = await createApp();
    });

    it('serves the Swagger UI at /api/docs', async () => {
      const res = await request(app!.getHttpServer())
        .get('/api/docs')
        .expect(200);

      expect(res.headers['content-type']).toMatch(/text\/html/);
      expect(res.text).toContain('swagger-ui');
    });

    it('serves the OpenAPI document at /api/docs/json', async () => {
      const res = await request(app!.getHttpServer())
        .get('/api/docs/json')
        .expect(200);

      expect(res.body.openapi).toEqual(expect.any(String));
      expect(Object.keys(res.body.paths)).toEqual(
        expect.arrayContaining(['/api/v1/auth/register', '/api/v1/auth/login']),
      );
    });

    it('declares the Bearer JWT scheme', async () => {
      const res = await request(app!.getHttpServer()).get('/api/docs/json');

      expect(res.body.components.securitySchemes.bearer).toEqual({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      });
    });
  });

  describe('auth endpoints', () => {
    let document: {
      paths: Record<string, Record<string, any>>;
      components: { schemas: Record<string, any> };
    };

    beforeEach(async () => {
      app = await createApp();
      document = (await request(app.getHttpServer()).get('/api/docs/json'))
        .body;
    });

    const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
    const jsonSchema = (response: any) =>
      response.content['application/json'].schema;

    it('documents register with 201, 400 and 409', () => {
      const register = document.paths['/api/v1/auth/register'].post;

      expect(Object.keys(register.responses).sort()).toEqual([
        '201',
        '400',
        '409',
      ]);
      expect(jsonSchema(register.responses['201'])).toEqual(
        ref('AuthResponseDto'),
      );
      expect(jsonSchema(register.responses['409'])).toEqual(
        ref('ErrorResponseDto'),
      );
      expect(jsonSchema(register.requestBody)).toEqual(ref('RegisterDto'));
    });

    it('documents login with 200, 400 and 401', () => {
      const login = document.paths['/api/v1/auth/login'].post;

      expect(Object.keys(login.responses).sort()).toEqual([
        '200',
        '400',
        '401',
      ]);
      expect(jsonSchema(login.responses['200'])).toEqual(
        ref('AuthResponseDto'),
      );
      expect(jsonSchema(login.requestBody)).toEqual(ref('LoginDto'));
    });

    it('describes the request bodies', () => {
      const { RegisterDto, LoginDto } = document.components.schemas;

      expect(RegisterDto.required).toEqual(
        expect.arrayContaining(['username', 'email', 'password']),
      );
      expect(RegisterDto.properties.password.minLength).toBe(8);
      expect(RegisterDto.properties.email.format).toBe('email');
      expect(RegisterDto.properties).not.toHaveProperty('role');
      expect(LoginDto.required).toEqual(
        expect.arrayContaining(['email', 'password']),
      );
    });

    it('describes the user without the password hash', () => {
      const { UserDto, AuthResponseDto } = document.components.schemas;

      expect(Object.keys(UserDto.properties).sort()).toEqual(
        ['createdAt', 'email', 'id', 'role', 'updatedAt', 'username'].sort(),
      );
      expect(UserDto.properties.role.enum).toEqual(['ADMIN', 'MEMBER']);
      expect(AuthResponseDto.properties.data).toEqual(ref('UserDto'));
      expect(AuthResponseDto.properties.access.type).toBe('string');
    });

    it('marks guarded routes with the Bearer scheme', () => {
      expect(document.paths['/api/v1/test-protected/any'].get.security).toEqual(
        [{ bearer: [] }],
      );
    });
  });

  describe('when disabled', () => {
    const saved = {
      NODE_ENV: process.env.NODE_ENV,
      SWAGGER_ENABLED: process.env.SWAGGER_ENABLED,
    };

    afterEach(() => {
      for (const [key, value] of Object.entries(saved)) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    });

    it('returns the 404 envelope in production', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.SWAGGER_ENABLED;
      app = await createApp();

      const res = await request(app.getHttpServer())
        .get('/api/docs')
        .expect(404);
      expect(res.body.errors.code).toBe('NOT_FOUND');

      await request(app.getHttpServer()).get('/api/docs/json').expect(404);
    });
  });
});
