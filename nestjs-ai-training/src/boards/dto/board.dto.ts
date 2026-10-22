import { ApiProperty } from '@nestjs/swagger';
import type { PublicBoard } from '../board.entity.js';

// Documentation-only shape of the public board object.
export class BoardDto implements PublicBoard {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'board 1' })
  name: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Sprint planning board',
  })
  description: string | null;

  @ApiProperty({
    format: 'uuid',
    description: 'Id of the Admin who created it',
  })
  createdBy: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  deletedAt: Date | null;
}
