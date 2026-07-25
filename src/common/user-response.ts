import { User } from '@prisma/client';

export type PublicUser = Pick<
  User,
  'id' | 'email' | 'role' | 'createdAt' | 'updatedAt'
>;

export function toPublicUser(user: User): PublicUser {
  // Whitelist public fields only — never expose passwordHash in API responses.
  const { id, email, role, createdAt, updatedAt } = user;
  return { id, email, role, createdAt, updatedAt };
}
