import type { DataResponse } from '../common/http/data-response.js';
import type { PublicUser } from '../users/user.entity.js';

// Register and login response.
export type AuthResponse = DataResponse<PublicUser> & { access: string };
