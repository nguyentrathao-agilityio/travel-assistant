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
