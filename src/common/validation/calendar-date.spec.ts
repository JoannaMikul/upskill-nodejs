import {
  CalendarDateSchema,
  isValidCalendarDate,
  parseCalendarDate,
} from './calendar-date';

describe('isValidCalendarDate', () => {
  it.each(['2026-01-15', '2028-02-29', '2025-12-31', '2026-12-31'])(
    'accepts valid calendar date %s',
    (value) => {
      expect(isValidCalendarDate(value)).toBe(true);
    },
  );

  it.each([
    '15-01-2026',
    '2026/01/15',
    '2026-1-15',
    '2026-01-5',
    'not-a-date',
    '',
  ])('rejects invalid format %s', (value) => {
    expect(isValidCalendarDate(value)).toBe(false);
  });

  it.each([
    '2026-02-30',
    '2026-02-29',
    '2026-13-01',
    '2026-00-15',
    '2026-04-31',
  ])('rejects invalid calendar day %s', (value) => {
    expect(isValidCalendarDate(value)).toBe(false);
  });
});

describe('parseCalendarDate', () => {
  it('returns UTC midnight for a valid date string', () => {
    const date = parseCalendarDate('2026-06-15');

    expect(date.toISOString()).toBe('2026-06-15T00:00:00.000Z');
  });

  it('throws for an invalid calendar date', () => {
    expect(() => parseCalendarDate('2026-02-30')).toThrow(
      'Invalid calendar date: 2026-02-30',
    );
  });
});

describe('CalendarDateSchema', () => {
  it('parses a valid date string', () => {
    expect(CalendarDateSchema.parse('2026-03-10')).toBe('2026-03-10');
  });

  it('rejects invalid format with a validation error', () => {
    const result = CalendarDateSchema.safeParse('03-10-2026');

    expect(result.success).toBe(false);
  });

  it('rejects impossible calendar dates with a validation error', () => {
    const result = CalendarDateSchema.safeParse('2026-02-30');

    expect(result.success).toBe(false);
  });

  it('validates issueDate and saleDate independently', () => {
    const issueDate = CalendarDateSchema.parse('2026-12-31');
    const saleDate = CalendarDateSchema.parse('2026-01-01');

    expect(issueDate).toBe('2026-12-31');
    expect(saleDate).toBe('2026-01-01');
  });
});
