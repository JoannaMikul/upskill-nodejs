import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ActivityLogListQuerySchema = z.object({
  accountId: z.uuid().optional(),
});

export class ActivityLogListQueryDto extends createZodDto(
  ActivityLogListQuerySchema,
) {}

export type ActivityLogListQuery = z.infer<typeof ActivityLogListQuerySchema>;
