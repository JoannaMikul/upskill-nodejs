import type { Invoice } from '@prisma/client';
import type { InvoiceResponseDto } from '../dto/invoice-response.dto';

export function toInvoiceResponseDto(invoice: Invoice): InvoiceResponseDto {
  const { id, customerId, createdAt, updatedAt } = invoice;
  return { id, customerId, createdAt, updatedAt };
}
