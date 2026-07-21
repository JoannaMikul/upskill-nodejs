import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const HelloQuerySchema = z.object({
  name: z.string().min(1),
});

export class HelloQueryDto extends createZodDto(HelloQuerySchema) {}
