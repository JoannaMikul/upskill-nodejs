import type { Role } from '@prisma/client';

export type CreateAccountInput = {
  email: string;
  passwordHash: string;
  role: Role;
};
