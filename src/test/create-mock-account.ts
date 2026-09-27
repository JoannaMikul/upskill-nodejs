import type { Account } from '@prisma/client';
import { Role } from '@prisma/client';

export const MOCK_ACCOUNT_ID = '550e8400-e29b-41d4-a716-446655440000';

export function createMockAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: MOCK_ACCOUNT_ID,
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: Role.CUSTOMER,
    createdAt: new Date('2026-02-05'),
    updatedAt: new Date('2026-05-25'),
    ...overrides,
  };
}
