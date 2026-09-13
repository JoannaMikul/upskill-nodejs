import type { VatRate } from '@prisma/client';

export type CreateInvoiceLineItemInput = {
  lineNumber: number;
  name: string;
  unitOfMeasure: string;
  quantity: string;
  unitNetPrice: string;
  vatRate: VatRate;
};

export type CreateInvoiceInput = {
  buyerId: string;
  invoiceNumber: string;
  issueDate: Date;
  saleDate: Date;
  lineItems: CreateInvoiceLineItemInput[];
};
