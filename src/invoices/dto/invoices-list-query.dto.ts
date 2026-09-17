import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const InvoicesListQuerySchema = z
  .object({
    year: z.coerce.number().int().min(2010).max(2050).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
  })
  .superRefine((value, ctx) => {
    const hasYear = value.year !== undefined;
    const hasMonth = value.month !== undefined;

    if (hasYear !== hasMonth) {
      ctx.addIssue({
        code: 'custom',
        message: 'year and month must be provided together',
        path: ['year'],
      });
    }
  });

export class InvoicesListQueryDto extends createZodDto(
  InvoicesListQuerySchema,
) {}

export type InvoicesListQuery = z.infer<typeof InvoicesListQuerySchema>;
