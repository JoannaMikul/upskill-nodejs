import { User } from '@prisma/client';
import { PublicUser } from '../dto/public-user.dto';

export function toPublicUser(user: User): PublicUser {
  // Whitelist public fields only — never expose passwordHash in API responses.
  const { id, email, role, createdAt, updatedAt } = user;
  return { id, email, role, createdAt, updatedAt };
}
