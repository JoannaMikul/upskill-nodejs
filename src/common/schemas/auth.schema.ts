import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, { message: 'Password is required' }),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}

export class LoginDto extends createZodDto(LoginSchema) {}
