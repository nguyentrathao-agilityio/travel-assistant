import { PasswordHasherService } from './password-hasher.service.js';

describe('PasswordHasherService', () => {
  const hasher = new PasswordHasherService();

  it('produces a bcrypt hash, never the plain password', async () => {
    const hash = await hasher.hash('password123');

    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
    expect(hash).not.toContain('password123');
  });

  it('uses a new salt for every hash', async () => {
    const [first, second] = await Promise.all([
      hasher.hash('password123'),
      hasher.hash('password123'),
    ]);

    expect(first).not.toBe(second);
  });

  it('verifies the correct password', async () => {
    const hash = await hasher.hash('password123');

    await expect(hasher.verify('password123', hash)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hasher.hash('password123');

    await expect(hasher.verify('wrong-pass', hash)).resolves.toBe(false);
  });

  it('rejects a value that is not a bcrypt hash', async () => {
    await expect(hasher.verify('password123', 'not-a-hash')).resolves.toBe(
      false,
    );
  });
});
