import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UserQuerySchema = z.object({
  email: z.email(),
});

export class UserQueryDto extends createZodDto(UserQuerySchema) {}
