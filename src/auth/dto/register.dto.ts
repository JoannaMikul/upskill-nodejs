import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
