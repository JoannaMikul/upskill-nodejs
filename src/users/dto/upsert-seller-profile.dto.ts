import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { NipSchema } from '../../common/validation/nip';

export const UpsertSellerProfileSchema = z.object({
  name: z.string().min(1),
  nip: NipSchema,
  address: z.string().min(1),
  bankAccountNumber: z.string().min(1).optional(),
});

export class UpsertSellerProfileDto extends createZodDto(
  UpsertSellerProfileSchema,
) {}
