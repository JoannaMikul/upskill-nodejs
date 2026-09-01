import type { RegisterCustomerDto } from '../dto/register-customer.dto';
import type { RegisterCustomerInput } from '../model/register-customer.input';

export function mapRegisterCustomerDtoToInput(
  dto: RegisterCustomerDto,
): RegisterCustomerInput {
  return {
    email: dto.email.toLowerCase(),
    password: dto.password,
  };
}
