import { Role } from '@prisma/client';

export type CreateUserInput = {
  email: string;
  passwordHash: string;
  role: Role;
};
