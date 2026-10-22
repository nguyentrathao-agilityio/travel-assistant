import type { Board } from '../generated/prisma/client.js';

export type { Board };

// Board object as designed: `createdById` is exposed as `createdBy`.
export interface PublicBoard {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export function toPublicBoard(board: Board): PublicBoard {
  const {
    id,
    name,
    description,
    createdById,
    createdAt,
    updatedAt,
    deletedAt,
  } = board;
  return {
    id,
    name,
    description,
    createdBy: createdById,
    createdAt,
    updatedAt,
    deletedAt,
  };
}
