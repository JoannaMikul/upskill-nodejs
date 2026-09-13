import { Prisma } from '@prisma/client';

export const invoiceDetailsArgs = Prisma.validator<Prisma.InvoiceDefaultArgs>()(
  {
    include: {
      seller: true,
      buyer: true,
      lineItems: { orderBy: { lineNumber: 'asc' } },
    },
  },
);

export const invoiceDetailsInclude = invoiceDetailsArgs.include;

export type InvoiceWithDetailsPayload = Prisma.InvoiceGetPayload<
  typeof invoiceDetailsArgs
>;

export type InvoiceWithDetails = Omit<
  InvoiceWithDetailsPayload,
  'seller' | 'buyer'
> & {
  seller: NonNullable<InvoiceWithDetailsPayload['seller']>;
  buyer: NonNullable<InvoiceWithDetailsPayload['buyer']>;
};

export function isInvoiceWithDetails(
  invoice: InvoiceWithDetailsPayload,
): invoice is InvoiceWithDetails {
  return invoice.seller !== null && invoice.buyer !== null;
}

export function assertInvoiceWithDetails(
  invoice: InvoiceWithDetailsPayload,
): InvoiceWithDetails {
  if (!isInvoiceWithDetails(invoice)) {
    throw new Error('Invoice is missing required seller or buyer snapshot');
  }

  return invoice;
}
