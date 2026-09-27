import { Prisma, VatRate } from '@prisma/client';

const VAT_RATE_PERCENTAGES: Record<VatRate, number> = {
  [VatRate.VAT_23]: 23,
  [VatRate.VAT_8]: 8,
  [VatRate.VAT_5]: 5,
  [VatRate.VAT_0]: 0,
  [VatRate.EXEMPT]: 0,
};

export type LineAmountInput = {
  quantity: Prisma.Decimal.Value;
  unitNetPrice: Prisma.Decimal.Value;
  vatRate: VatRate;
};

export type CalculatedLineAmounts = {
  netAmount: Prisma.Decimal;
  vatAmount: Prisma.Decimal;
  grossAmount: Prisma.Decimal;
};

export type CalculatedInvoiceTotals = {
  netAmount: Prisma.Decimal;
  vatAmount: Prisma.Decimal;
  grossAmount: Prisma.Decimal;
};

function toDecimal(value: Prisma.Decimal.Value): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

function roundHalfUp(value: Prisma.Decimal): Prisma.Decimal {
  return value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

export function calculateLineAmounts(
  input: LineAmountInput,
): CalculatedLineAmounts {
  const quantity = toDecimal(input.quantity);
  const unitNetPrice = toDecimal(input.unitNetPrice);

  const netAmount = roundHalfUp(quantity.mul(unitNetPrice));
  const vatAmount = roundHalfUp(
    netAmount.mul(VAT_RATE_PERCENTAGES[input.vatRate]).div(100),
  );
  const grossAmount = netAmount.add(vatAmount);

  return { netAmount, vatAmount, grossAmount };
}

export function calculateInvoiceTotals(
  lineAmounts: CalculatedLineAmounts[],
): CalculatedInvoiceTotals {
  return lineAmounts.reduce(
    (totals, line) => ({
      netAmount: totals.netAmount.add(line.netAmount),
      vatAmount: totals.vatAmount.add(line.vatAmount),
      grossAmount: totals.grossAmount.add(line.grossAmount),
    }),
    {
      netAmount: new Prisma.Decimal(0),
      vatAmount: new Prisma.Decimal(0),
      grossAmount: new Prisma.Decimal(0),
    },
  );
}
