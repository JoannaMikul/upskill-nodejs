import type { Account } from '@prisma/client';

export type CustomerListItemResponseDto = Pick<
  Account,
  'id' | 'email' | 'isActive' | 'createdAt'
>;
