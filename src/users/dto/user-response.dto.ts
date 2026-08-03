import { Account } from '@prisma/client';

export type UserResponseDto = Pick<
  Account,
  'id' | 'email' | 'role' | 'createdAt' | 'updatedAt'
>;
