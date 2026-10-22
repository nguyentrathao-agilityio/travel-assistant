import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/http/pagination-query.dto.js';

export class ListBoardsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Case-insensitive partial match on the board name',
    example: 'project',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
