import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import type { DataResponse } from '../common/http/data-response.js';
import type { ListResponse } from '../common/http/list-response.js';
import {
  ApiDataResponse,
  ApiErrorResponse,
  ApiListResponse,
} from '../common/swagger/api-responses.js';
import { Role } from '../users/role.enum.js';
import type { PublicBoard } from './board.entity.js';
import { BoardsService } from './boards.service.js';
import { BoardIdParamDto } from './dto/board-id-param.dto.js';
import { BoardDto } from './dto/board.dto.js';
import { CreateBoardDto } from './dto/create-board.dto.js';
import { ListBoardsQueryDto } from './dto/list-boards-query.dto.js';
import { UpdateBoardDto } from './dto/update-board.dto.js';

const INVALID_ID = 'Malformed board id (VALIDATION_FAILED)';
const INVALID_BODY =
  'Missing or invalid fields (VALIDATION_FAILED) or unreadable body (BAD_REQUEST)';

@ApiTags('boards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  @ApiOperation({
    summary:
      'List boards: all for an Admin, own boards for a Member; newest first',
  })
  @ApiListResponse(BoardDto, 'A page of boards')
  @ApiErrorResponse(
    HttpStatus.BAD_REQUEST,
    'Invalid page or limit (VALIDATION_FAILED)',
  )
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, 'Missing or invalid token')
  list(
    @Req() req: AuthenticatedRequest,
    @Query() query: ListBoardsQueryDto,
  ): Promise<ListResponse<PublicBoard>> {
    return this.boardsService.list(req.user, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a board (Members: only boards they belong to)',
  })
  @ApiDataResponse(BoardDto, { description: 'The board' })
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, INVALID_ID)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, 'Missing or invalid token')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, 'Member does not belong to the board')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, 'Board not found or archived')
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param() params: BoardIdParamDto,
  ): Promise<DataResponse<PublicBoard>> {
    return { data: await this.boardsService.findOne(req.user, params.id) };
  }

  @Post()
  @Roles([Role.ADMIN])
  @ApiOperation({ summary: 'Create a board (Admin only)' })
  @ApiDataResponse(BoardDto, {
    status: HttpStatus.CREATED,
    description: 'The new board',
  })
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, INVALID_BODY)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, 'Missing or invalid token')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, 'Not an Admin')
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateBoardDto,
  ): Promise<DataResponse<PublicBoard>> {
    return { data: await this.boardsService.create(req.user, dto) };
  }

  @Patch(':id')
  @Roles([Role.ADMIN])
  @ApiOperation({ summary: 'Update name and/or description (Admin only)' })
  @ApiDataResponse(BoardDto, { description: 'The updated board' })
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, `${INVALID_ID} or ${INVALID_BODY}`)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, 'Missing or invalid token')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, 'Not an Admin')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, 'Board not found or archived')
  async update(
    @Param() params: BoardIdParamDto,
    @Body() dto: UpdateBoardDto,
  ): Promise<DataResponse<PublicBoard>> {
    return { data: await this.boardsService.update(params.id, dto) };
  }

  @Delete(':id')
  @Roles([Role.ADMIN])
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a board (soft delete, Admin only)' })
  @ApiNoContentResponse({ description: 'Board archived' })
  @ApiErrorResponse(HttpStatus.BAD_REQUEST, INVALID_ID)
  @ApiErrorResponse(HttpStatus.UNAUTHORIZED, 'Missing or invalid token')
  @ApiErrorResponse(HttpStatus.FORBIDDEN, 'Not an Admin')
  @ApiErrorResponse(HttpStatus.NOT_FOUND, 'Board not found or archived')
  archive(@Param() params: BoardIdParamDto): Promise<void> {
    return this.boardsService.archive(params.id);
  }
}
