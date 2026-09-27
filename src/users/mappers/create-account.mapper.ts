import { Role } from '@prisma/client';
import type { CreateAccountInput } from '../model/create-account.input';

export function mapToCreateAccountInput(
  email: string,
  passwordHash: string,
  role: Role = Role.CUSTOMER,
): CreateAccountInput {
  return { email, passwordHash, role };
}
