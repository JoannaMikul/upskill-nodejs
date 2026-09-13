import { parseCalendarDate } from '../../common/validation/calendar-date';
import type { CreateInvoiceDto } from '../dto/create-invoice.dto';
import type { CreateInvoiceInput } from '../model/create-invoice.input';

export function mapCreateInvoiceDtoToInput(
  dto: CreateInvoiceDto,
): CreateInvoiceInput {
  return {
    buyerId: dto.buyerId,
    invoiceNumber: dto.invoiceNumber,
    issueDate: parseCalendarDate(dto.issueDate),
    saleDate: parseCalendarDate(dto.saleDate),
    lineItems: dto.lineItems.map((lineItem) => ({
      lineNumber: lineItem.lineNumber,
      name: lineItem.name,
      unitOfMeasure: lineItem.unitOfMeasure,
      quantity: lineItem.quantity,
      unitNetPrice: lineItem.unitNetPrice,
      vatRate: lineItem.vatRate,
    })),
  };
}
