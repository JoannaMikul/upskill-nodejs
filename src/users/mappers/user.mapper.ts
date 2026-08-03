import { Account } from '@prisma/client';
import { PublicUser } from '../dto/public-user.dto';

export function toPublicUser(account: Account): PublicUser {
  // Whitelist public fields only — never expose passwordHash in API responses.
  const { id, email, role, createdAt, updatedAt } = account;
  return { id, email, role, createdAt, updatedAt };
}
