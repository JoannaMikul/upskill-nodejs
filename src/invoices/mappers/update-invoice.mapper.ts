import { parseCalendarDate } from '../../common/validation/calendar-date';
import type { UpdateInvoiceDto } from '../dto/update-invoice.dto';
import type { UpdateInvoiceInput } from '../model/update-invoice.input';

export function mapUpdateInvoiceDtoToInput(
  dto: UpdateInvoiceDto,
): UpdateInvoiceInput {
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
