import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { NipSchema } from '../../common/validation/nip';

export const UpdateContractorSchema = z.object({
  name: z.string().min(1).optional(),
  nip: NipSchema.optional(),
  address: z.string().min(1).optional(),
  postalCode: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  email: z.email().optional(),
  phone: z.string().min(1).optional(),
  bankAccountNumber: z.string().min(1).optional(),
});

export class UpdateContractorDto extends createZodDto(UpdateContractorSchema) {}
