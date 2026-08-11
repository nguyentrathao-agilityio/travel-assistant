// Fixed dev-only namespace — no per-user scoping until real auth exists.
export const MEMORY_NAMESPACE = ['dev', 'memories'];

export const MAX_MEMORY_LENGTH = 150;

// Constants
import { TOOL_NAMES } from './tools';

export const BOOKING_TOOL_NAMES: readonly string[] = [
  TOOL_NAMES.BOOK_FLIGHT,
  TOOL_NAMES.BOOK_HOTEL,
  TOOL_NAMES.CANCEL_BOOKING,
];

export const MAX_EXTRACT_MEMORY_MESSAGES = 4;
