import { Role, User } from '@prisma/client';

export const MOCK_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: MOCK_USER_ID,
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: Role.SUBCONTRACTOR,
    createdAt: new Date('2026-02-05'),
    updatedAt: new Date('2026-05-25'),
    ...overrides,
  };
}
