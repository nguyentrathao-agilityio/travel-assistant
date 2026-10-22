import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { JwtPayload } from '../auth/jwt-payload.js';
import { buildMeta, type ListResponse } from '../common/http/list-response.js';
import type { Board, Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '../users/role.enum.js';
import { toPublicBoard, type PublicBoard } from './board.entity.js';
import type { CreateBoardDto } from './dto/create-board.dto.js';
import type { ListBoardsQueryDto } from './dto/list-boards-query.dto.js';
import type { UpdateBoardDto } from './dto/update-board.dto.js';

// Admins see every board, Members only the boards they belong to.
// Archived boards are hidden from everyone.
@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    user: JwtPayload,
    query: Pick<ListBoardsQueryDto, 'search' | 'page' | 'limit'>,
  ): Promise<ListResponse<PublicBoard>> {
    const { search, page, limit } = query;
    const where: Prisma.BoardWhereInput = { deletedAt: null };
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (user.role !== Role.ADMIN) {
      where.members = { some: { userId: user.sub } };
    }

    const [total, boards] = await this.prisma.$transaction([
      this.prisma.board.count({ where }),
      this.prisma.board.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return {
      meta: buildMeta(total, page, limit),
      data: boards.map(toPublicBoard),
    };
  }

  // Unknown or archived → 404; existing board the Member is not in → 403.
  async findOne(user: JwtPayload, id: string): Promise<PublicBoard> {
    const board = await this.findActive(id);
    if (user.role !== Role.ADMIN) {
      const membership = await this.prisma.boardMember.findUnique({
        where: { boardId_userId: { boardId: board.id, userId: user.sub } },
      });
      if (!membership) {
        throw new ForbiddenException();
      }
    }

    return toPublicBoard(board);
  }

  // The creating Admin is not added as a member.
  async create(user: JwtPayload, dto: CreateBoardDto): Promise<PublicBoard> {
    const board = await this.prisma.board.create({
      data: {
        name: dto.name,
        description: dto.description,
        createdById: user.sub,
      },
    });
    return toPublicBoard(board);
  }

  async update(id: string, dto: UpdateBoardDto): Promise<PublicBoard> {
    const board = await this.findActive(id);
    const updated = await this.prisma.board.update({
      where: { id: board.id },
      data: { name: dto.name, description: dto.description },
    });
    return toPublicBoard(updated);
  }

  async archive(id: string): Promise<void> {
    const board = await this.findActive(id);
    await this.prisma.board.update({
      where: { id: board.id },
      data: { deletedAt: new Date() },
    });
  }

  private async findActive(id: string): Promise<Board> {
    const board = await this.prisma.board.findFirst({
      where: { id, deletedAt: null },
    });
    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return board;
  }
}
