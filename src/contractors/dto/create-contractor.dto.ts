import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { NipSchema } from '../../common/validation/nip';

export const CreateContractorSchema = z.object({
  name: z.string().min(1),
  nip: NipSchema,
  address: z.string().min(1),
  postalCode: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1).default('PL'),
  email: z.email().optional(),
  phone: z.string().min(1).optional(),
  bankAccountNumber: z.string().min(1).optional(),
});

export class CreateContractorDto extends createZodDto(CreateContractorSchema) {}
