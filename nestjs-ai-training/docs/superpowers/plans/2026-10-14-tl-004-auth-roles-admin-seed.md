# TL-004 Auth Contract, Roles Guard, Admin Seed — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make register/login return the designed `{ data: User, access }` contract, add a `@Roles()` decorator + `RolesGuard`, remove the undocumented `GET /` and `GET /auth/me`, and add an idempotent Admin seed script.

**Architecture:** `AuthService` issues a token for both register and login and returns `AuthResponse` (`DataResponse<PublicUser> & { access }`). `RolesGuard` reads role metadata set by a `Reflector.createDecorator` decorator and runs after `JwtAuthGuard`. The seed logic is a pure function (`seedAdmin`) over `UsersService` + `PasswordHasherService`, unit-tested with fakes and e2e-tested against the test DB; a thin entry file (`src/seed/main.ts`) runs it after `nest build`.

**Tech Stack:** NestJS 12 (ESM), `@nestjs/jwt`, Prisma 7, bcryptjs, Jest 30 (native ESM, no `jest` object), supertest.

**Spec:** `docs/tickets/TL-004-auth-contract-roles-admin-seed.md`; requirements in `docs/requirements.md` (FR-AUTH-01…03, FR-ROLE-01/02, AC-AUTH-01…07, DES-AUTH-01/02, D-02, D-12, D-17, D-18, DEV-002, DEV-007, DEV-010; ADR-010 in `docs/architecture.md`).

## Global Constraints

- Register: `POST /api/v1/auth/register` → **201** `{ data: User, access: "<token>" }`; 400; 409 (D-02, DES-AUTH-01).
- Login: `POST /api/v1/auth/login` → **200** `{ data: User, access: "<token>" }`; 401 (D-02, DES-AUTH-02).
- User object: exactly `id, username, email, role, createdAt, updatedAt`; never `passwordHash`/`password`.
- Access token: 1 hour, no refresh token, claims `{ sub, email, role }` (D-17).
- Roles: `ADMIN`, `MEMBER` codes (D-08). Forbidden → **403** `{ errors: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action' } }` (filter default).
- Remove `GET /` and `GET /auth/me` and their tests (D-18).
- Admin seed credentials come only from env vars (`ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`), documented in `.env.example`, **no defaults**; seed is idempotent.
- `role` in request bodies is ignored (global `ValidationPipe` whitelist — already in place).
- Repo conventions (`CLAUDE.md`): `.js` relative imports, `import type` for type-only imports, Prettier + oxlint clean, no `jest.fn()`/`jest.spyOn()` (hand-written stubs), blank line after `if`/loop blocks, comments only on main functions/classes.
- **No `git commit`** unless the user explicitly asks. Each task ends with a checkpoint, not a commit.

## Decisions in this plan that need approval

1. **Seed vs. existing non-admin user:** if a user with `ADMIN_EMAIL` already exists as `MEMBER`, the seed **fails with an error** rather than promoting them (promotion is not a confirmed rule). If it exists as `ADMIN`, the seed is a no-op and does **not** reset the password.
2. **Seed command:** new script `"db:seed": "nest build && node --env-file-if-exists=.env dist/seed/main.js"` in `package.json` (no new dependency; Node 24 runs the compiled output).
3. **`CreateUserInput.role?`**: `UsersService.create` gains an optional `role` so the seed can create an Admin. `RegisterDto` is unchanged, so clients still cannot set it.
4. **Test-only protected routes:** since `GET /auth/me` is removed, there is no real authenticated endpoint yet. AC-AUTH-06 and the 403 criterion are tested via a test-only controller in `test/fixtures/` (same pattern as `ThrowingController` in `test/errors.e2e-spec.ts`).
5. **Deleted files (D-18):** `src/app.controller.ts`, `src/app.controller.spec.ts`, `src/app.service.ts`, `test/app.e2e-spec.ts`.

## Review Focus

1. A request **without a token** to an `ADMIN`-only route must get **401**, not 403 (guard order `JwtAuthGuard, RolesGuard`). → Task 3 test.
2. An **expired** token or one signed with **another secret** must get 401. → Task 3 tests.
3. The seed run with **missing/short env values** must fail before touching the DB and must not log the password. → Task 4 unit tests.
4. The seed when `ADMIN_EMAIL` already belongs to a **MEMBER** must not silently promote or duplicate. → Task 4 unit test.
5. Register with a **mixed-case email** must return `data.email` lowercased, and login's `data` must never carry the hash. → Task 2 e2e tests.

## File Structure

| File | Action | Responsibility |
| ---- | ------ | -------------- |
| `src/common/http/data-response.ts` | Create | `DataResponse<T>` = `{ data: T }` shared type (DES-API-04) |
| `src/auth/auth-response.ts` | Create | `AuthResponse` = `DataResponse<PublicUser> & { access: string }` |
| `src/auth/auth.service.ts` | Modify | register/login return `AuthResponse` |
| `src/auth/auth.service.spec.ts` | Modify | new contract tests |
| `src/auth/auth.controller.ts` | Modify | new return types; remove `GET me` |
| `src/auth/roles.decorator.ts` | Create | `Roles` decorator |
| `src/auth/roles.guard.ts` | Create | `RolesGuard` |
| `src/auth/roles.guard.spec.ts` | Create | guard unit tests |
| `src/auth/auth.module.ts` | Modify | provide + export `RolesGuard` |
| `src/app.module.ts` | Modify | drop `AppController`/`AppService` |
| `src/app.controller.ts`, `src/app.controller.spec.ts`, `src/app.service.ts`, `test/app.e2e-spec.ts` | Delete | D-18 |
| `src/users/users.service.ts` | Modify | optional `role` in `CreateUserInput` |
| `src/users/users.service.spec.ts` | Modify | role pass-through test |
| `test/fakes/in-memory-users.service.ts` | Modify | honour `input.role` |
| `src/seed/seed-admin.ts` | Create | `readAdminSeedConfig`, `seedAdmin` |
| `src/seed/seed-admin.spec.ts` | Create | unit tests |
| `src/seed/main.ts` | Create | CLI entry |
| `test/fixtures/protected.controller.ts` | Create | test-only guarded routes |
| `test/auth.e2e-spec.ts` | Modify | new contract; drop `/auth/me` |
| `test/roles.e2e-spec.ts` | Create | 401/403/allowed, token expiry |
| `test/seed.e2e-spec.ts` | Create | idempotent seed against test DB |
| `test/errors.e2e-spec.ts` | Modify | 401 test uses fixture route; `GET /api/v1` → 404 |
| `package.json` | Modify | `db:seed` script |
| `.env.example`, `CLAUDE.md`, `docs/architecture.md`, `docs/requirements.md`, `docs/tickets/TL-004-*.md`, `docs/tickets/README.md` | Modify | docs |

---

### Task 1: `@Roles()` decorator and `RolesGuard`

**Files:**
- Create: `src/auth/roles.decorator.ts`, `src/auth/roles.guard.ts`
- Test: `src/auth/roles.guard.spec.ts`
- Modify: `src/auth/auth.module.ts`

**Interfaces:**
- Consumes: `AuthenticatedRequest` (`src/auth/jwt-auth.guard.ts`), `JwtPayload`, `Role`.
- Produces: `Roles` (decorator, `Roles(...)` takes `Role[]` → use as `@Roles([Role.ADMIN])`), `RolesGuard` (exported from `AuthModule`). Usage: `@UseGuards(JwtAuthGuard, RolesGuard)`.

- [ ] **Step 1: Write the failing test** — `src/auth/roles.guard.spec.ts`

```ts
import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../users/role.enum.js';
import type { JwtPayload } from './jwt-payload.js';
import { Roles } from './roles.decorator.js';
import { RolesGuard } from './roles.guard.js';

class MixedController {
  open(): void {}

  @Roles([Role.ADMIN])
  adminOnly(): void {}
}

@Roles([Role.ADMIN])
class AdminController {
  inherited(): void {}

  @Roles([Role.ADMIN, Role.MEMBER])
  overridden(): void {}
}

const member: JwtPayload = { sub: '1', email: 'm@x.io', role: Role.MEMBER };
const admin: JwtPayload = { sub: '2', email: 'a@x.io', role: Role.ADMIN };

// Minimal ExecutionContext for an HTTP request handled by `controller[handler]`.
function contextFor(
  controller: abstract new () => object,
  handler: string,
  user?: JwtPayload,
): ExecutionContext {
  const prototype = controller.prototype as Record<string, () => void>;
  return {
    getClass: () => controller,
    getHandler: () => prototype[handler],
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('allows any authenticated user when no roles are required', () => {
    expect(guard.canActivate(contextFor(MixedController, 'open', member))).toBe(
      true,
    );
  });

  it('forbids a Member on an Admin-only handler', () => {
    expect(() =>
      guard.canActivate(contextFor(MixedController, 'adminOnly', member)),
    ).toThrow(ForbiddenException);
  });

  it('allows an Admin on an Admin-only handler', () => {
    expect(
      guard.canActivate(contextFor(MixedController, 'adminOnly', admin)),
    ).toBe(true);
  });

  it('applies class-level roles to every handler', () => {
    expect(() =>
      guard.canActivate(contextFor(AdminController, 'inherited', member)),
    ).toThrow(ForbiddenException);
  });

  it('lets handler roles override class roles', () => {
    expect(
      guard.canActivate(contextFor(AdminController, 'overridden', member)),
    ).toBe(true);
  });

  it('forbids when roles are required but no user is on the request', () => {
    expect(() =>
      guard.canActivate(contextFor(MixedController, 'adminOnly')),
    ).toThrow(ForbiddenException);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/auth/roles.guard.spec.ts`
Expected: FAIL — `Cannot find module './roles.decorator.js'`.

- [ ] **Step 3: Implement**

`src/auth/roles.decorator.ts`:

```ts
import { Reflector } from '@nestjs/core';
import type { Role } from '../users/role.enum.js';

// Restricts a handler or controller to the given roles; enforced by RolesGuard.
export const Roles = Reflector.createDecorator<Role[]>();
```

`src/auth/roles.guard.ts`:

```ts
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from './jwt-auth.guard.js';
import { Roles } from './roles.decorator.js';

// Checks `@Roles()` against the JWT role. Must run after JwtAuthGuard:
// `@UseGuards(JwtAuthGuard, RolesGuard)`.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride(Roles, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<Partial<AuthenticatedRequest>>();
    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenException();
    }

    return true;
  }
}
```

`src/auth/auth.module.ts` — add the import and change providers/exports:

```ts
import { RolesGuard } from './roles.guard.js';
// …
  providers: [AuthService, PasswordHasherService, JwtAuthGuard, RolesGuard],
  exports: [JwtAuthGuard, RolesGuard, JwtModule],
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/auth/roles.guard.spec.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Checkpoint** — `pnpm lint`; show the diff. No commit unless the user asks.

---

### Task 2: Register/login return `{ data: User, access }`

**Files:**
- Create: `src/common/http/data-response.ts`, `src/auth/auth-response.ts`
- Modify: `src/auth/auth.service.ts`, `src/auth/auth.controller.ts`
- Test: `src/auth/auth.service.spec.ts`, `test/auth.e2e-spec.ts`

**Interfaces:**
- Consumes: `toPublicUser`, `PublicUser`, `JwtPayload`.
- Produces: `DataResponse<T>` (`{ data: T }`), `AuthResponse` (`DataResponse<PublicUser> & { access: string }`); `AuthService.register(dto): Promise<AuthResponse>`, `AuthService.login(dto): Promise<AuthResponse>`. Later tasks read `res.body.access` and `res.body.data`.

- [ ] **Step 1: Update the unit tests** — in `src/auth/auth.service.spec.ts`, replace the `describe('register')` and `describe('login')` blocks with:

```ts
  describe('register', () => {
    it('returns the new Member user and an access token', async () => {
      const { data, access } = await authService.register(registerDto);

      expect(data).toMatchObject({
        username: 'alice',
        email: 'alice@example.com',
        role: Role.MEMBER,
      });
      expect(typeof access).toBe('string');
    });

    it('issues a token with the user id, email and role', async () => {
      const { data, access } = await authService.register(registerDto);
      const payload = await jwtService.verifyAsync<JwtPayload>(access);

      expect(payload).toMatchObject({
        sub: data.id,
        email: 'alice@example.com',
        role: Role.MEMBER,
      });
    });

    it('returns exactly the public user fields', async () => {
      const { data } = await authService.register(registerDto);

      expect(Object.keys(data).sort()).toEqual(
        ['createdAt', 'email', 'id', 'role', 'updatedAt', 'username'].sort(),
      );
    });

    it('stores a hash, not the plain password', async () => {
      const { data } = await authService.register(registerDto);
      const stored = await usersService.findById(data.id);

      expect(stored?.passwordHash).toBeDefined();
      expect(stored?.passwordHash).not.toContain(registerDto.password);
    });

    it('rejects a duplicate email', async () => {
      await authService.register(registerDto);

      await expect(
        authService.register({
          ...registerDto,
          username: 'bob',
          email: 'ALICE@example.com',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a duplicate username', async () => {
      await authService.register(registerDto);

      await expect(
        authService.register({ ...registerDto, email: 'other@example.com' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register(registerDto);
    });

    it('returns the user and a token with the user id, email and role', async () => {
      const { data, access } = await authService.login({
        email: registerDto.email,
        password: registerDto.password,
      });
      const payload = await jwtService.verifyAsync<JwtPayload>(access);

      expect(data).toMatchObject({ email: registerDto.email, role: Role.MEMBER });
      expect(data).not.toHaveProperty('passwordHash');
      expect(payload).toMatchObject({
        sub: data.id,
        email: registerDto.email,
        role: Role.MEMBER,
      });
    });

    it('rejects a wrong password', async () => {
      await expect(
        authService.login({ email: registerDto.email, password: 'wrong-pass' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an unknown email with the same error', async () => {
      await expect(
        authService.login({
          email: 'nobody@example.com',
          password: registerDto.password,
        }),
      ).rejects.toThrow('Invalid email or password');
    });
  });
```

- [ ] **Step 2: Update the e2e tests** — in `test/auth.e2e-spec.ts`:

Replace the first two `register` tests with:

```ts
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
      const res = await register({ ...user, email: 'Alice@Example.COM' }).expect(
        201,
      );

      expect(res.body.data.email).toBe('alice@example.com');
    });

    it('ignores a client-supplied role', async () => {
      const res = await register({ ...user, role: 'ADMIN' }).expect(201);

      expect(res.body.data.role).toBe('MEMBER');
    });
```

Replace `'returns an access token for valid credentials'` with:

```ts
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
```

In `describe('GET /auth/me')` (removed in Task 3), change the token lookup so it still compiles and passes in between:

```ts
      const {
        body: { access },
      } = await login({ email: user.email, password: user.password });

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${access}`)
        .expect(200);
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test src/auth/auth.service.spec.ts` and `pnpm test:e2e test/auth.e2e-spec.ts`
Expected: FAIL — `data`/`access` undefined (register returns the bare user; login returns `{ accessToken }`).

- [ ] **Step 4: Implement**

`src/common/http/data-response.ts`:

```ts
// Single-item response envelope (DES-API-04).
export interface DataResponse<T> {
  data: T;
}
```

`src/auth/auth-response.ts`:

```ts
import type { DataResponse } from '../common/http/data-response.js';
import type { PublicUser } from '../users/user.entity.js';

// Register and login response (D-02).
export type AuthResponse = DataResponse<PublicUser> & { access: string };
```

`src/auth/auth.service.ts` — new imports and methods:

```ts
import { toPublicUser } from '../users/user.entity.js';
import type { User } from '../users/user.entity.js';
import type { AuthResponse } from './auth-response.js';
// … (keep the other imports)

  async register(dto: RegisterDto): Promise<AuthResponse> {
    if (await this.usersService.findByEmail(dto.email)) {
      throw new ConflictException('Email is already registered');
    }

    if (await this.usersService.findByUsername(dto.username)) {
      throw new ConflictException('Username is already taken');
    }

    const user = await this.usersService.create({
      username: dto.username,
      email: dto.email,
      passwordHash: await this.passwordHasher.hash(dto.password),
    });
    return this.toAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(dto.email);
    const valid =
      user &&
      (await this.passwordHasher.verify(dto.password, user.passwordHash));
    if (!user || !valid) {
      // Same message for unknown email and wrong password.
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.toAuthResponse(user);
  }

  // Public user plus a token with claims { sub, email, role } (D-17).
  private async toAuthResponse(user: User): Promise<AuthResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return {
      data: toPublicUser(user),
      access: await this.jwtService.signAsync(payload),
    };
  }
```

(The existing `import { PublicUser, toPublicUser }` line becomes the two imports above; `PublicUser` is no longer used in this file.)

`src/auth/auth.controller.ts` — change the two handlers' return types (leave `me` for Task 3):

```ts
import type { AuthResponse } from './auth-response.js';
// …
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test src/auth/auth.service.spec.ts` and `pnpm test:e2e test/auth.e2e-spec.ts`
Expected: PASS.

- [ ] **Step 6: Checkpoint** — `pnpm lint`; show the diff. No commit unless asked.

---

### Task 3: Guarded routes e2e; remove `GET /` and `GET /auth/me`

**Files:**
- Create: `test/fixtures/protected.controller.ts`, `test/roles.e2e-spec.ts`
- Modify: `src/auth/auth.controller.ts`, `src/app.module.ts`, `test/auth.e2e-spec.ts`, `test/errors.e2e-spec.ts`
- Delete: `src/app.controller.ts`, `src/app.controller.spec.ts`, `src/app.service.ts`, `test/app.e2e-spec.ts`

**Interfaces:**
- Consumes: `Roles`, `RolesGuard`, `JwtAuthGuard`, `AuthModule` (exports both guards + `JwtModule`), `AuthResponse.access`.
- Produces: `ProtectedTestController` at `/api/v1/test-protected/any` (JWT only, returns `{ data: JwtPayload }`) and `/api/v1/test-protected/admin` (`ADMIN` only, returns `{ data: 'ok' }`). Test modules using it must import `[AppModule, AuthModule]` so the guards' dependencies resolve. Task 4 reuses it.

- [ ] **Step 1: Write the fixture and failing tests**

`test/fixtures/protected.controller.ts`:

```ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard.js';
import type { AuthenticatedRequest } from '../../src/auth/jwt-auth.guard.js';
import type { JwtPayload } from '../../src/auth/jwt-payload.js';
import { Roles } from '../../src/auth/roles.decorator.js';
import { RolesGuard } from '../../src/auth/roles.guard.js';
import { Role } from '../../src/users/role.enum.js';

// Test-only routes: no real authenticated or Admin-only endpoint exists yet.
// Test modules must import AuthModule so the guards can be resolved.
@Controller('test-protected')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProtectedTestController {
  @Get('any')
  any(@Req() request: AuthenticatedRequest): { data: JwtPayload } {
    return { data: request.user };
  }

  @Get('admin')
  @Roles([Role.ADMIN])
  admin(): { data: string } {
    return { data: 'ok' };
  }
}
```

`test/roles.e2e-spec.ts`:

```ts
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
    const req = request(app.getHttpServer()).get(`/api/v1/test-protected/${path}`);
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };

  const adminPayload: JwtPayload = {
    sub: '00000000-0000-0000-0000-000000000001',
    email: 'admin@example.com',
    role: Role.ADMIN,
  };

  describe('authenticated endpoint (AC-AUTH-06)', () => {
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

  describe('Admin-only endpoint (FR-AUTH-03)', () => {
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

  describe('access token (D-17)', () => {
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
```

`test/errors.e2e-spec.ts` — import the fixture and `AuthModule`, register them, and switch the 401 test off `/auth/me`; add a `GET /api/v1` 404 test:

```ts
import { AuthModule } from './../src/auth/auth.module.js';
import { ProtectedTestController } from './fixtures/protected.controller.js';
// …
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, AuthModule],
      controllers: [ThrowingController, ProtectedTestController],
    }).compile();
// …
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
// … inside describe('/api/v1 prefix'):
    it('returns 404 NOT_FOUND for GET /api/v1 (D-18)', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1').expect(404);

      expect(res.body.errors.code).toBe('NOT_FOUND');
    });
```

In `test/auth.e2e-spec.ts`, add a test for the removed route and delete the whole `describe('GET /auth/me', …)` block:

```ts
  it('no longer serves GET /auth/me (D-18)', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(404);
  });
```

- [ ] **Step 2: Run tests to verify the right ones fail**

Run: `pnpm test:e2e`
Expected: exactly two failures — `GET /api/v1` → 404 (currently 200 "Hello World!") and `GET /auth/me` → 404 (currently 401). The `roles` suite already passes, because Tasks 1–2 provide the guard and `access`; if any of its tests fail, fix that before removing routes.

- [ ] **Step 3: Remove the undocumented routes (D-18)**

```bash
rm src/app.controller.ts src/app.controller.spec.ts src/app.service.ts test/app.e2e-spec.ts
```

`src/app.module.ts` — remove the `AppController`/`AppService` imports, `controllers: [AppController],` and `AppService,` from providers.

`src/auth/auth.controller.ts` — delete the `me` handler, and the now-unused imports (`Get`, `NotFoundException`, `Req`, `UseGuards`, `toPublicUser`, `PublicUser`, `UsersService`, `JwtAuthGuard`, `AuthenticatedRequest`); the constructor keeps only `authService`:

```ts
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import type { AuthResponse } from './auth-response.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test` and `pnpm test:e2e`
Expected: all PASS.

- [ ] **Step 5: Checkpoint** — `pnpm lint`; show the diff. No commit unless asked.

---

### Task 4: Idempotent Admin seed (D-12, ADR-010)

**Files:**
- Modify: `src/users/users.service.ts`, `src/users/users.service.spec.ts`, `test/fakes/in-memory-users.service.ts`, `package.json`, `.env.example`
- Create: `src/seed/seed-admin.ts`, `src/seed/main.ts`
- Test: `src/seed/seed-admin.spec.ts`, `test/seed.e2e-spec.ts`

**Interfaces:**
- Consumes: `UsersService.findByEmail/create`, `PasswordHasherService.hash`, `Role`, `ProtectedTestController` (Task 3).
- Produces: `CreateUserInput.role?: Role`; `AdminSeedConfig { username; email; password }`; `readAdminSeedConfig(env: NodeJS.ProcessEnv): AdminSeedConfig`; `seedAdmin(users, hasher, config): Promise<'created' | 'exists'>`; `pnpm db:seed`.

- [ ] **Step 1: Write the failing tests**

`src/users/users.service.spec.ts` — add inside `describe('create')`:

```ts
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
```

(add `import { Role } from './role.enum.js';` at the top.)

`src/seed/seed-admin.spec.ts`:

```ts
import { PasswordHasherService } from '../auth/password-hasher.service.js';
import { Role } from '../users/role.enum.js';
import { InMemoryUsersService } from '../../test/fakes/in-memory-users.service.js';
import { readAdminSeedConfig, seedAdmin } from './seed-admin.js';

const env = {
  ADMIN_USERNAME: ' admin ',
  ADMIN_EMAIL: ' Admin@Example.com ',
  ADMIN_PASSWORD: 'admin-password',
};

describe('readAdminSeedConfig', () => {
  it('reads and normalizes the admin credentials', () => {
    expect(readAdminSeedConfig(env)).toEqual({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin-password',
    });
  });

  it('lists every missing variable', () => {
    expect(() => readAdminSeedConfig({ ADMIN_USERNAME: 'admin' })).toThrow(
      'Missing environment variables: ADMIN_EMAIL, ADMIN_PASSWORD',
    );
  });

  it('treats blank values as missing', () => {
    expect(() =>
      readAdminSeedConfig({ ...env, ADMIN_EMAIL: '   ' }),
    ).toThrow('Missing environment variables: ADMIN_EMAIL');
  });

  it('rejects a password shorter than 8 characters without echoing it', () => {
    expect(() =>
      readAdminSeedConfig({ ...env, ADMIN_PASSWORD: 'short' }),
    ).toThrow(/^ADMIN_PASSWORD must be at least 8 characters$/);
  });
});

describe('seedAdmin', () => {
  let users: InMemoryUsersService;
  const hasher = new PasswordHasherService();
  const config = readAdminSeedConfig(env);

  beforeEach(() => {
    users = new InMemoryUsersService();
  });

  it('creates an Admin with a hashed password', async () => {
    await expect(seedAdmin(users, hasher, config)).resolves.toBe('created');

    const admin = await users.findByEmail(config.email);
    expect(admin?.role).toBe(Role.ADMIN);
    expect(admin?.username).toBe('admin');
    await expect(
      hasher.verify(config.password, admin?.passwordHash ?? ''),
    ).resolves.toBe(true);
  });

  it('is a no-op when the Admin already exists', async () => {
    await seedAdmin(users, hasher, config);
    const before = await users.findByEmail(config.email);

    await expect(
      seedAdmin(users, hasher, { ...config, password: 'another-password' }),
    ).resolves.toBe('exists');

    const after = await users.findByEmail(config.email);
    expect(after?.passwordHash).toBe(before?.passwordHash);
  });

  it('refuses to reuse the email of a non-admin user', async () => {
    await users.create({
      username: 'someone',
      email: config.email,
      passwordHash: 'hash',
    });

    await expect(seedAdmin(users, hasher, config)).rejects.toThrow(
      'ADMIN_EMAIL belongs to an existing non-admin user',
    );
    expect((await users.findByEmail(config.email))?.role).toBe(Role.MEMBER);
  });
});
```

`test/seed.e2e-spec.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/seed src/users` and `pnpm test:e2e test/seed.e2e-spec.ts`
Expected: FAIL — `Cannot find module './seed-admin.js'`; the users test fails because `role` is not passed to Prisma.

- [ ] **Step 3: Implement**

`src/users/users.service.ts`:

```ts
import { Role } from './role.enum.js';
// …
export interface CreateUserInput {
  username: string;
  email: string;
  passwordHash: string;
  // Server-side only (Admin seed); registration never sets it.
  role?: Role;
}
// … in create():
        data: {
          username: input.username,
          email: input.email.toLowerCase(),
          passwordHash: input.passwordHash,
          role: input.role,
        },
```

(`import type { Role }` is enough if `Role` is used only in the interface.)

`test/fakes/in-memory-users.service.ts` — in `create`, replace `role: Role.MEMBER,` with:

```ts
      role: input.role ?? Role.MEMBER,
```

`src/seed/seed-admin.ts`:

```ts
import type { PasswordHasherService } from '../auth/password-hasher.service.js';
import { Role } from '../users/role.enum.js';
import type { UsersService } from '../users/users.service.js';

export interface AdminSeedConfig {
  username: string;
  email: string;
  password: string;
}

const REQUIRED = ['ADMIN_USERNAME', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'] as const;
const MIN_PASSWORD_LENGTH = 8;

// Reads the Admin credentials from the environment; no defaults (D-12).
export function readAdminSeedConfig(env: NodeJS.ProcessEnv): AdminSeedConfig {
  const missing = REQUIRED.filter((name) => !env[name]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  const password = env.ADMIN_PASSWORD!;
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
  }

  return {
    username: env.ADMIN_USERNAME!.trim(),
    email: env.ADMIN_EMAIL!.trim().toLowerCase(),
    password,
  };
}

// Creates the Admin once. Re-running is a no-op and never resets the
// password; an existing non-admin user with the same email is an error.
export async function seedAdmin(
  users: Pick<UsersService, 'findByEmail' | 'create'>,
  hasher: Pick<PasswordHasherService, 'hash'>,
  config: AdminSeedConfig,
): Promise<'created' | 'exists'> {
  const existing = await users.findByEmail(config.email);
  if (existing) {
    if (existing.role !== Role.ADMIN) {
      throw new Error('ADMIN_EMAIL belongs to an existing non-admin user');
    }

    return 'exists';
  }

  await users.create({
    username: config.username,
    email: config.email,
    passwordHash: await hasher.hash(config.password),
    role: Role.ADMIN,
  });
  return 'created';
}
```

`src/seed/main.ts`:

```ts
import { PasswordHasherService } from '../auth/password-hasher.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { readAdminSeedConfig, seedAdmin } from './seed-admin.js';

// `pnpm db:seed`: validates the env before connecting, never logs credentials.
const config = readAdminSeedConfig(process.env);
const prisma = new PrismaService();
try {
  const result = await seedAdmin(
    new UsersService(prisma),
    new PasswordHasherService(),
    config,
  );
  console.log(result === 'created' ? 'Admin created' : 'Admin already exists');
} finally {
  await prisma.$disconnect();
}
```

`package.json` scripts — add after `db:generate`:

```json
    "db:seed": "nest build && node --env-file-if-exists=.env dist/seed/main.js"
```

`.env.example` — append:

```bash

# Admin account created by `pnpm db:seed` (D-12). Required, no defaults;
# password at least 8 characters. Re-running the seed does not change an
# existing Admin.
ADMIN_USERNAME=
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test` and `pnpm test:e2e`
Expected: all PASS.

- [ ] **Step 5: Run the real entry point twice against the test database**

```bash
pnpm build
DATABASE_URL="$TEST_DATABASE_URL" ADMIN_USERNAME=admin ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=admin-password node --env-file-if-exists=.env dist/seed/main.js
DATABASE_URL="$TEST_DATABASE_URL" ADMIN_USERNAME=admin ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=admin-password node --env-file-if-exists=.env dist/seed/main.js
ADMIN_USERNAME= node --env-file-if-exists=.env dist/seed/main.js; echo "exit=$?"
```

(Load `TEST_DATABASE_URL` from `.env` first, e.g. `export $(grep ^TEST_DATABASE_URL .env)`.)
Expected: `Admin created`, then `Admin already exists`, then a non-zero exit with `Missing environment variables: ADMIN_USERNAME…` (if the other two are not set in `.env`). The e2e suite truncates the test DB, so this leaves nothing behind after the next run.

- [ ] **Step 6: Checkpoint** — `pnpm lint`; show the diff. No commit unless asked.

---

### Task 5: Docs, ticket status, full verification

**Files:** `CLAUDE.md`, `docs/architecture.md`, `docs/requirements.md`, `docs/tickets/TL-004-auth-contract-roles-admin-seed.md`, `docs/tickets/README.md`

- [ ] **Step 1: Update docs**
  - `CLAUDE.md`: Commands — add `pnpm db:seed   # create the Admin from ADMIN_* env vars (idempotent)`. Architecture → Auth — add: "`RolesGuard` + `@Roles([Role.ADMIN])` (`src/auth/roles.*`), used as `@UseGuards(JwtAuthGuard, RolesGuard)`; forbidden → 403. Register/login return `AuthResponse` `{ data, access }`." Mention `DataResponse<T>` in `src/common/http/data-response.ts` under Responses, and `test/fixtures/protected.controller.ts` for guard e2e tests.
  - `docs/architecture.md` §2.2: remove the `GET /api/v1` and `GET /api/v1/auth/me` rows; set register/login "Current behaviour" to `201 { data: User, access }` / `200 { data: User, access }`. §2.1 `AuthModule` row: "Register, login, JWT, roles guard". §3.3: replace the `_TBD — mechanism…_` line with the roles guard description (board membership checks still TL-006). ADR-010: "implemented in TL-004 (`pnpm db:seed`)".
  - `docs/requirements.md`: DEV-002, DEV-007, DEV-010 → "Implemented (TL-004)"; update the §3 implementation-status note under FR-AUTH (lines ~83–85); DES-API-01/05, DES-AUTH-01/02 "Code" column if still stale. Do **not** change any `Confirmed` status.
  - Ticket TL-004: tick acceptance criteria and checklist; Status → `In review`; Notes — list the five approved decisions above. `docs/tickets/README.md` index → `In review`.

- [ ] **Step 2: Full verification**

Run: `pnpm lint && pnpm test && pnpm test:e2e && pnpm build`
Expected: all succeed. Report actual output (counts of suites/tests).

- [ ] **Step 3: Self-review the diff** — `git diff dev...HEAD --stat` plus `git status`; check: no `passwordHash` in any response, no credentials logged, no leftover `accessToken` references (`grep -rn accessToken src test` → none), no references to `AppController`/`AppService`.

- [ ] **Step 4: Checkpoint** — summarize to the user; commit/MR only when asked.
