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
