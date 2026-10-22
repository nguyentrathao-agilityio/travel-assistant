import { Reflector } from '@nestjs/core';
import type { Role } from '../users/role.enum.js';

// Restricts a handler or controller to the given roles; enforced by RolesGuard.
export const Roles = Reflector.createDecorator<Role[]>();
