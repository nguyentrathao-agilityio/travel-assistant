import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from '../../users/dto/user.dto.js';
import type { AuthResponse } from '../auth-response.js';

// Documentation-only shape of the register and login response.
export class AuthResponseDto implements AuthResponse {
  @ApiProperty({ type: UserDto })
  data: UserDto;

  @ApiProperty({ description: 'Bearer access token, valid for 1 hour' })
  access: string;
}
