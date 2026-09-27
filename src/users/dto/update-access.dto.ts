import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateAccessSchema = z.object({
  isActive: z.boolean(),
});

export class UpdateAccessDto extends createZodDto(UpdateAccessSchema) {}
