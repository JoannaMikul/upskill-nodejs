import { RegisterDto } from '../dto/register.dto';
import { RegisterCredentials } from '../model/register-credentials.input';

export function mapRegisterDtoToCredentials(
  dto: RegisterDto,
): RegisterCredentials {
  return {
    email: dto.email.toLowerCase(),
    password: dto.password,
  };
}
