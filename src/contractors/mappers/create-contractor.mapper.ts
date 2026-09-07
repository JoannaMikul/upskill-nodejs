import type { CreateContractorDto } from '../dto/create-contractor.dto';
import type { CreateContractorInput } from '../model/create-contractor.input';

export function mapCreateContractorDtoToInput(
  dto: CreateContractorDto,
): CreateContractorInput {
  return {
    name: dto.name,
    nip: dto.nip,
    address: dto.address,
    postalCode: dto.postalCode,
    city: dto.city,
    country: dto.country,
    email: dto.email,
    phone: dto.phone,
    bankAccountNumber: dto.bankAccountNumber,
  };
}
