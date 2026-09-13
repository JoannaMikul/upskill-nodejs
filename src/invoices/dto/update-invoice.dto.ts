import { createZodDto } from 'nestjs-zod';
import { CreateInvoiceSchema } from './create-invoice.dto';

export class UpdateInvoiceDto extends createZodDto(CreateInvoiceSchema) {}
