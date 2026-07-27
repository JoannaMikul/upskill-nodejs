import { Role } from '@prisma/client';
import { CreateUserInput } from '../model/create-user.input';

export function mapToCreateUserInput(
  email: string,
  passwordHash: string,
  role: Role = Role.SUBCONTRACTOR,
): CreateUserInput {
  return { email, passwordHash, role };
}
