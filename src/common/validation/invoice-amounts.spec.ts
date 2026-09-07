import { VatRate } from '@prisma/client';
import {
  calculateInvoiceTotals,
  calculateLineAmounts,
} from './invoice-amounts';

function formatMoney(amount: { toFixed(digits: number): string }) {
  return amount.toFixed(2);
}

function amountsToStrings(amounts: {
  netAmount: { toFixed(digits: number): string };
  vatAmount: { toFixed(digits: number): string };
  grossAmount: { toFixed(digits: number): string };
}) {
  return {
    netAmount: formatMoney(amounts.netAmount),
    vatAmount: formatMoney(amounts.vatAmount),
    grossAmount: formatMoney(amounts.grossAmount),
  };
}

describe('calculateLineAmounts', () => {
  it.each([
    {
      vatRate: VatRate.VAT_23,
      quantity: '2',
      unitNetPrice: '100',
      expected: {
        netAmount: '200.00',
        vatAmount: '46.00',
        grossAmount: '246.00',
      },
    },
    {
      vatRate: VatRate.VAT_8,
      quantity: '1',
      unitNetPrice: '100',
      expected: {
        netAmount: '100.00',
        vatAmount: '8.00',
        grossAmount: '108.00',
      },
    },
    {
      vatRate: VatRate.VAT_5,
      quantity: '1',
      unitNetPrice: '100',
      expected: {
        netAmount: '100.00',
        vatAmount: '5.00',
        grossAmount: '105.00',
      },
    },
    {
      vatRate: VatRate.VAT_0,
      quantity: '1',
      unitNetPrice: '100',
      expected: {
        netAmount: '100.00',
        vatAmount: '0.00',
        grossAmount: '100.00',
      },
    },
    {
      vatRate: VatRate.EXEMPT,
      quantity: '1',
      unitNetPrice: '100',
      expected: {
        netAmount: '100.00',
        vatAmount: '0.00',
        grossAmount: '100.00',
      },
    },
  ])(
    'calculates amounts for $vatRate',
    ({ vatRate, quantity, unitNetPrice, expected }) => {
      const result = calculateLineAmounts({ quantity, unitNetPrice, vatRate });

      expect(amountsToStrings(result)).toEqual(expected);
    },
  );

  it('rounds net amount half-up to 2 decimal places', () => {
    const result = calculateLineAmounts({
      quantity: '3',
      unitNetPrice: '33.335',
      vatRate: VatRate.VAT_23,
    });

    expect(formatMoney(result.netAmount)).toBe('100.01');
    expect(formatMoney(result.vatAmount)).toBe('23.00');
    expect(formatMoney(result.grossAmount)).toBe('123.01');
  });

  it('rounds vat amount half-up to 2 decimal places', () => {
    const result = calculateLineAmounts({
      quantity: '1',
      unitNetPrice: '10.01',
      vatRate: VatRate.VAT_23,
    });

    expect(formatMoney(result.netAmount)).toBe('10.01');
    expect(formatMoney(result.vatAmount)).toBe('2.30');
    expect(formatMoney(result.grossAmount)).toBe('12.31');
  });

  it('supports quantity with up to 3 decimal places', () => {
    const result = calculateLineAmounts({
      quantity: '1.333',
      unitNetPrice: '10.50',
      vatRate: VatRate.VAT_23,
    });

    expect(formatMoney(result.netAmount)).toBe('14.00');
    expect(formatMoney(result.vatAmount)).toBe('3.22');
    expect(formatMoney(result.grossAmount)).toBe('17.22');
  });
});

describe('calculateInvoiceTotals', () => {
  it('sums calculated line amounts into invoice totals', () => {
    const lines = [
      calculateLineAmounts({
        quantity: '2',
        unitNetPrice: '100',
        vatRate: VatRate.VAT_23,
      }),
      calculateLineAmounts({
        quantity: '1',
        unitNetPrice: '50',
        vatRate: VatRate.VAT_8,
      }),
    ];

    const totals = calculateInvoiceTotals(lines);

    expect(amountsToStrings(totals)).toEqual({
      netAmount: '250.00',
      vatAmount: '50.00',
      grossAmount: '300.00',
    });
  });

  it('returns zero totals for an empty list of line amounts', () => {
    const totals = calculateInvoiceTotals([]);

    expect(amountsToStrings(totals)).toEqual({
      netAmount: '0.00',
      vatAmount: '0.00',
      grossAmount: '0.00',
    });
  });
});
