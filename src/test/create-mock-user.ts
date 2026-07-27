import { Role, User } from '@prisma/client';

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-uuid',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    role: Role.SUBCONTRACTOR,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}
