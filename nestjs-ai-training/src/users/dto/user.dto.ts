import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../role.enum.js';
import type { PublicUser } from '../user.entity.js';

// Documentation-only shape of the public user object.
export class UserDto implements PublicUser {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'alice' })
  username: string;

  @ApiProperty({ format: 'email', example: 'alice@example.com' })
  email: string;

  @ApiProperty({ enum: Role, example: Role.MEMBER })
  role: Role;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
