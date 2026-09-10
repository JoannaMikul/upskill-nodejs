import type { UpdateAccessDto } from '../dto/update-access.dto';
import type { UpdateAccessInput } from '../model/update-access.input';

export function mapUpdateAccessDtoToInput(
  dto: UpdateAccessDto,
): UpdateAccessInput {
  return { isActive: dto.isActive };
}
