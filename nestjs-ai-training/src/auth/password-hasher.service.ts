import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';

// bcrypt via bcryptjs: same algorithm and `$2b$` hashes as the native
// `bcrypt` package, without a native build step.
const COST_FACTOR = 10;

@Injectable()
export class PasswordHasherService {
  hash(password: string): Promise<string> {
    return hash(password, COST_FACTOR);
  }

  async verify(password: string, stored: string): Promise<boolean> {
    try {
      return await compare(password, stored);
    } catch {
      // Not a bcrypt hash.
      return false;
    }
  }
}
