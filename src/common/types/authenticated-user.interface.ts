import { Role } from '@prisma/client';

export interface JwtPayload {
  /** JWT "subject" claim — the authenticated user's id (UUID). */
  sub: string;
  role: Role;
}

export interface AuthenticatedUser {
  /** Same as JwtPayload.sub — user id attached to the request after token validation. */
  sub: string;
  role: Role;
}
