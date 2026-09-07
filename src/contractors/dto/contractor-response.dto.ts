import type { Contractor } from '@prisma/client';

export type ContractorResponseDto = Pick<
  Contractor,
  | 'id'
  | 'name'
  | 'nip'
  | 'address'
  | 'postalCode'
  | 'city'
  | 'country'
  | 'email'
  | 'phone'
  | 'bankAccountNumber'
  | 'createdAt'
  | 'updatedAt'
>;
