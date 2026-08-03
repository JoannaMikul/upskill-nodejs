import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UserByEmailQuerySchema = z.object({
  email: z.email(),
});

export class UserByEmailQueryDto extends createZodDto(UserByEmailQuerySchema) {}
