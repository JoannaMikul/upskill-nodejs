import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AuthLoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, { message: 'Password is required' }),
});

export class AuthLoginDto extends createZodDto(AuthLoginSchema) {}
