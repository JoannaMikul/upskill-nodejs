import type { Account, Customer, SellerProfile } from '@prisma/client';
import type { UserResponseDto } from '../dto/user-response.dto';

type AccountWithCustomer = Account & {
  customer?:
    | (Pick<Customer, 'notificationChannel' | 'phoneNumber'> & {
        sellerProfile?: Pick<
          SellerProfile,
          'name' | 'nip' | 'address' | 'bankAccountNumber'
        > | null;
      })
    | null;
};

export function toUserResponseDto(
  account: AccountWithCustomer,
): UserResponseDto {
  // Whitelist public fields only — never expose passwordHash in API responses.
  const { id, email, role, isActive, createdAt, updatedAt, customer } = account;
  return {
    id,
    email,
    role,
    isActive,
    createdAt,
    updatedAt,
    notificationChannel: customer?.notificationChannel ?? null,
    phoneNumber: customer?.phoneNumber ?? null,
    sellerProfile: customer?.sellerProfile ?? null,
  };
}
