import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../users/role.enum.js';
import { UsersService } from '../users/users.service.js';
import { InMemoryUsersService } from '../../test/fakes/in-memory-users.service.js';
import { AuthService } from './auth.service.js';
import { JwtPayload } from './jwt-payload.js';
import { PasswordHasherService } from './password-hasher.service.js';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const registerDto = {
    username: 'alice',
    email: 'alice@example.com',
    password: 'password123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'unit-test-secret' })],
      providers: [
        AuthService,
        PasswordHasherService,
        { provide: UsersService, useClass: InMemoryUsersService },
      ],
    }).compile();

    authService = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

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

      expect(data).toMatchObject({
        email: registerDto.email,
        role: Role.MEMBER,
      });
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
});
