import { Invoice } from '@prisma/client';
import { InvoiceResponseDto } from '../dto/invoice-response.dto';

export function toInvoiceResponseDto(invoice: Invoice): InvoiceResponseDto {
  const { id, customerId, createdAt, updatedAt } = invoice;
  return { id, customerId, createdAt, updatedAt };
}
