import { RegisterCustomerDto } from '../dto/register-customer.dto';
import { RegisterCustomerInput } from '../model/register-customer.input';

export function mapRegisterCustomerDtoToInput(
  dto: RegisterCustomerDto,
): RegisterCustomerInput {
  return {
    email: dto.email.toLowerCase(),
    password: dto.password,
  };
}
