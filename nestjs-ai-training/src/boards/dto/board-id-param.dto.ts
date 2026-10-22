import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class BoardIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id: string;
}
