import { isInvoiceReminderDay } from './is-invoice-reminder-day';

describe('isInvoiceReminderDay', () => {
  it.each([
    ['28 January (31-day month)', new Date(2026, 0, 28), true],
    ['25 February 2026 (28-day month)', new Date(2026, 1, 25), true],
    ['27 April (30-day month)', new Date(2026, 3, 27), true],
  ])('returns %s → %s', (_label, date, expected) => {
    expect(isInvoiceReminderDay(date)).toBe(expected);
  });

  it.each([
    ['one day before the reminder day', new Date(2026, 0, 27), false],
    ['one day after the reminder day', new Date(2026, 0, 29), false],
  ])('returns false %s', (_label, date, expected) => {
    expect(isInvoiceReminderDay(date)).toBe(expected);
  });
});
