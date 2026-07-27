import { User } from '@prisma/client';

export type PublicUser = Pick<
  User,
  'id' | 'email' | 'role' | 'createdAt' | 'updatedAt'
>;
