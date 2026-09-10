import type { SellerProfile } from '@prisma/client';

export type SellerProfileResponseDto = Pick<
  SellerProfile,
  'name' | 'nip' | 'address' | 'bankAccountNumber'
>;
