import { Prisma, VatRate } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { CalendarDateSchema } from '../../common/validation/calendar-date';

const QUANTITY_PATTERN = /^\d+(\.\d{1,3})?$/;
const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

const VatRateSchema = z.enum([
  VatRate.VAT_23,
  VatRate.VAT_8,
  VatRate.VAT_5,
  VatRate.VAT_0,
  VatRate.EXEMPT,
]);

export const CreateInvoiceLineItemSchema = z.object({
  lineNumber: z.int().positive('Line number must be a positive integer'),
  name: z.string().min(1),
  unitOfMeasure: z.string().min(1),
  quantity: z
    .string()
    .regex(
      QUANTITY_PATTERN,
      'Quantity must be a decimal with up to 3 decimal places',
    )
    .refine(
      (value) => new Prisma.Decimal(value).gt(0),
      'Quantity must be greater than 0',
    ),
  unitNetPrice: z
    .string()
    .regex(
      MONEY_PATTERN,
      'Unit net price must be a decimal with up to 2 decimal places',
    ),
  vatRate: VatRateSchema,
});

export const CreateInvoiceSchema = z.object({
  buyerId: z.uuid('Buyer id must be a valid UUID'),
  invoiceNumber: z.string().min(1),
  issueDate: CalendarDateSchema,
  saleDate: CalendarDateSchema,
  lineItems: z
    .array(CreateInvoiceLineItemSchema)
    .min(1, 'At least one line item is required'),
});

export type CreateInvoice = z.infer<typeof CreateInvoiceSchema>;

export class CreateInvoiceDto extends createZodDto(CreateInvoiceSchema) {}
