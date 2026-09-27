import type { UpsertSellerProfileDto } from '../dto/upsert-seller-profile.dto';
import type { UpsertSellerProfileInput } from '../model/upsert-seller-profile.input';

export function mapUpsertSellerProfileDtoToInput(
  dto: UpsertSellerProfileDto,
): UpsertSellerProfileInput {
  return {
    name: dto.name,
    nip: dto.nip,
    address: dto.address,
    bankAccountNumber: dto.bankAccountNumber,
  };
}
