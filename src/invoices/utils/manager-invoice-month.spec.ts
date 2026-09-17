import {
  getIssueDateRangeForCalendarMonth,
  getPreviousCalendarMonth,
} from './manager-invoice-month';

describe('manager-invoice-month', () => {
  describe('getPreviousCalendarMonth', () => {
    it('returns August when reference is September', () => {
      expect(getPreviousCalendarMonth(new Date(Date.UTC(2026, 8, 17)))).toEqual(
        { year: 2026, month: 8 },
      );
    });

    it('returns December of previous year when reference is January', () => {
      expect(getPreviousCalendarMonth(new Date(Date.UTC(2026, 0, 5)))).toEqual({
        year: 2025,
        month: 12,
      });
    });
  });

  describe('getIssueDateRangeForCalendarMonth', () => {
    it('builds UTC half-open range for issueDate filtering', () => {
      const range = getIssueDateRangeForCalendarMonth(2026, 2);

      expect(range.start).toEqual(new Date(Date.UTC(2026, 1, 1)));
      expect(range.endExclusive).toEqual(new Date(Date.UTC(2026, 2, 1)));
    });
  });
});
