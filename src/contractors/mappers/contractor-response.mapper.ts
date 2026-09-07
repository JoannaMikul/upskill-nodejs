import type { Contractor } from '@prisma/client';
import type { ContractorResponseDto } from '../dto/contractor-response.dto';

export function toContractorResponseDto(
  contractor: Contractor,
): ContractorResponseDto {
  const {
    id,
    name,
    nip,
    address,
    postalCode,
    city,
    country,
    email,
    phone,
    bankAccountNumber,
    createdAt,
    updatedAt,
  } = contractor;

  return {
    id,
    name,
    nip,
    address,
    postalCode,
    city,
    country,
    email,
    phone,
    bankAccountNumber,
    createdAt,
    updatedAt,
  };
}
