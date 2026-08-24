import { Invoice } from '@prisma/client';

export type InvoiceResponseDto = Pick<
  Invoice,
  'id' | 'customerId' | 'createdAt' | 'updatedAt'
>;
