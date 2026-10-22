import { Role } from '../users/role.enum.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}
