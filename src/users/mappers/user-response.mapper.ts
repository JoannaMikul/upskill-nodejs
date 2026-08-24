import { Account } from '@prisma/client';
import { UserResponseDto } from '../dto/user-response.dto';

export function toUserResponseDto(account: Account): UserResponseDto {
  // Whitelist public fields only — never expose passwordHash in API responses.
  const { id, email, role, createdAt, updatedAt } = account;
  return { id, email, role, createdAt, updatedAt };
}
