import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

// Only name and description are updatable; other fields are stripped by the
// global ValidationPipe.
export class UpdateBoardDto {
  @ApiPropertyOptional({ example: 'board 1' })
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @ApiPropertyOptional({ example: 'Sprint planning board', nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;
}
