import { Account } from '@prisma/client';

export type PublicUser = Pick<
  Account,
  'id' | 'email' | 'role' | 'createdAt' | 'updatedAt'
>;
