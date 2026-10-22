import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard.js';
import type { AuthenticatedRequest } from '../../src/auth/jwt-auth.guard.js';
import type { JwtPayload } from '../../src/auth/jwt-payload.js';
import { Roles } from '../../src/auth/roles.decorator.js';
import { RolesGuard } from '../../src/auth/roles.guard.js';
import { Role } from '../../src/users/role.enum.js';

// Test-only routes: no real authenticated or Admin-only endpoint exists yet.
// Test modules must import AuthModule so the guards can be resolved.
@ApiBearerAuth()
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
