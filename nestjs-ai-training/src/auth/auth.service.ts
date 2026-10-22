import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { toPublicUser } from '../users/user.entity.js';
import type { User } from '../users/user.entity.js';
import { UsersService } from '../users/users.service.js';
import type { AuthResponse } from './auth-response.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { JwtPayload } from './jwt-payload.js';
import { PasswordHasherService } from './password-hasher.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly jwtService: JwtService,
  ) {}

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

  // Public user plus a token with claims { sub, email, role }.
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
}
