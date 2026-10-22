import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorResponse } from '../common/swagger/api-responses.js';
import type { AuthResponse } from './auth-response.js';
import { AuthService } from './auth.service.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new account (role MEMBER)' })
  @ApiCreatedResponse({
    type: AuthResponseDto,
    description: 'The new user and an access token',
  })
  @ApiErrorResponse(
    HttpStatus.BAD_REQUEST,
    'Missing or invalid fields (VALIDATION_FAILED) or unreadable body (BAD_REQUEST)',
  )
  @ApiErrorResponse(HttpStatus.CONFLICT, 'Username or email already registered')
  register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'The user and an access token',
  })
  @ApiErrorResponse(
    HttpStatus.BAD_REQUEST,
    'Missing or invalid fields (VALIDATION_FAILED) or unreadable body (BAD_REQUEST)',
  )
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, 'Invalid email or password')
  login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }
}
