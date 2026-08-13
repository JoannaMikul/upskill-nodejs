import { Account, Customer } from '@prisma/client';
import { UserResponseDto } from '../dto/user-response.dto';

type AccountWithCustomer = Account & {
  customer?: Pick<Customer, 'notificationChannel' | 'phoneNumber'> | null;
};

export function toUserResponseDto(
  account: AccountWithCustomer,
): UserResponseDto {
  // Whitelist public fields only — never expose passwordHash in API responses.
  const { id, email, role, createdAt, updatedAt, customer } = account;
  return {
    id,
    email,
    role,
    createdAt,
    updatedAt,
    notificationChannel: customer?.notificationChannel ?? null,
    phoneNumber: customer?.phoneNumber ?? null,
  };
}
