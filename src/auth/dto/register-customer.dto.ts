import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RegisterCustomerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export class RegisterCustomerDto extends createZodDto(RegisterCustomerSchema) {}
