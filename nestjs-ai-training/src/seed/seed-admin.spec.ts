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
    expect(() => readAdminSeedConfig({ ...env, ADMIN_EMAIL: '   ' })).toThrow(
      'Missing environment variables: ADMIN_EMAIL',
    );
  });

  it.each(['admin', 'admin@', '@example.com'])(
    'rejects a malformed ADMIN_EMAIL (%s)',
    (email) => {
      expect(() => readAdminSeedConfig({ ...env, ADMIN_EMAIL: email })).toThrow(
        'ADMIN_EMAIL must be a valid email address',
      );
    },
  );

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
