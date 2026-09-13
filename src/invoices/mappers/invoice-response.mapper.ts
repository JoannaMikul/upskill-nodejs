import type {
  InvoiceBuyer,
  InvoiceLineItem,
  InvoiceSeller,
} from '@prisma/client';
import type {
  InvoiceBuyerResponseDto,
  InvoiceLineItemResponseDto,
  InvoiceResponseDto,
  InvoiceSellerResponseDto,
} from '../dto/invoice-response.dto';
import type { InvoiceWithDetails } from '../model/invoice-with-details';

function formatCalendarDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMoney(amount: { toFixed(digits: number): string }): string {
  return amount.toFixed(2);
}

function formatQuantity(amount: { toString(): string }): string {
  return amount.toString();
}

function toInvoiceSellerResponseDto(
  seller: InvoiceSeller,
): InvoiceSellerResponseDto {
  const { name, nip, address, bankAccountNumber } = seller;
  return { name, nip, address, bankAccountNumber };
}

function toInvoiceBuyerResponseDto(
  buyer: InvoiceBuyer,
): InvoiceBuyerResponseDto {
  const { contractorId, name, nip, address, postalCode, city, country } = buyer;
  return {
    contractorId,
    name,
    nip,
    address,
    postalCode,
    city,
    country,
  };
}

function toInvoiceLineItemResponseDto(
  lineItem: InvoiceLineItem,
): InvoiceLineItemResponseDto {
  const {
    id,
    lineNumber,
    name,
    unitOfMeasure,
    quantity,
    unitNetPrice,
    vatRate,
    netAmount,
    vatAmount,
    grossAmount,
  } = lineItem;

  return {
    id,
    lineNumber,
    name,
    unitOfMeasure,
    quantity: formatQuantity(quantity),
    unitNetPrice: formatMoney(unitNetPrice),
    vatRate,
    netAmount: formatMoney(netAmount),
    vatAmount: formatMoney(vatAmount),
    grossAmount: formatMoney(grossAmount),
  };
}

export function toInvoiceResponseDto(
  invoice: InvoiceWithDetails,
): InvoiceResponseDto {
  const {
    id,
    customerId,
    invoiceNumber,
    issueDate,
    saleDate,
    netAmount,
    vatAmount,
    grossAmount,
    status,
    verifiedAt,
    verifiedByAccountId,
    createdAt,
    updatedAt,
    seller,
    buyer,
    lineItems,
  } = invoice;

  return {
    id,
    customerId,
    invoiceNumber,
    issueDate: formatCalendarDate(issueDate),
    saleDate: formatCalendarDate(saleDate),
    netAmount: formatMoney(netAmount),
    vatAmount: formatMoney(vatAmount),
    grossAmount: formatMoney(grossAmount),
    status,
    verifiedAt,
    verifiedByAccountId,
    createdAt,
    updatedAt,
    seller: toInvoiceSellerResponseDto(seller),
    buyer: toInvoiceBuyerResponseDto(buyer),
    lineItems: lineItems.map(toInvoiceLineItemResponseDto),
  };
}
