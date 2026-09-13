import type {
  Invoice,
  InvoiceBuyer,
  InvoiceSeller,
  VatRate,
} from '@prisma/client';

export type InvoiceSellerResponseDto = Pick<
  InvoiceSeller,
  'name' | 'nip' | 'address' | 'bankAccountNumber'
>;

export type InvoiceBuyerResponseDto = Pick<
  InvoiceBuyer,
  | 'contractorId'
  | 'name'
  | 'nip'
  | 'address'
  | 'postalCode'
  | 'city'
  | 'country'
>;

export type InvoiceLineItemResponseDto = {
  id: string;
  lineNumber: number;
  name: string;
  unitOfMeasure: string;
  quantity: string;
  unitNetPrice: string;
  vatRate: VatRate;
  netAmount: string;
  vatAmount: string;
  grossAmount: string;
};

export type InvoiceResponseDto = Pick<
  Invoice,
  | 'id'
  | 'customerId'
  | 'invoiceNumber'
  | 'status'
  | 'verifiedAt'
  | 'verifiedByAccountId'
  | 'createdAt'
  | 'updatedAt'
> & {
  issueDate: string;
  saleDate: string;
  netAmount: string;
  vatAmount: string;
  grossAmount: string;
  seller: InvoiceSellerResponseDto;
  buyer: InvoiceBuyerResponseDto;
  lineItems: InvoiceLineItemResponseDto[];
};
