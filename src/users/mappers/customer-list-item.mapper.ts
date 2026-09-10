import type { Account } from '@prisma/client';
import type { CustomerListItemResponseDto } from '../dto/customer-list-item-response.dto';

export function toCustomerListItemResponseDto(
  account: Account,
): CustomerListItemResponseDto {
  const { id, email, isActive, createdAt } = account;
  return { id, email, isActive, createdAt };
}
