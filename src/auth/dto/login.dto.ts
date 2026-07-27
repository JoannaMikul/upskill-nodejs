import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, { message: 'Password is required' }),
});

export class LoginDto extends createZodDto(LoginSchema) {}
