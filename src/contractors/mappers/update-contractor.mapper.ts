import type { UpdateContractorDto } from '../dto/update-contractor.dto';
import type { UpdateContractorInput } from '../model/update-contractor.input';

export function mapUpdateContractorDtoToInput(
  dto: UpdateContractorDto,
): UpdateContractorInput {
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
