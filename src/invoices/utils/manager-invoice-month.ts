export type CalendarMonth = {
  year: number;
  month: number;
};

export function getPreviousCalendarMonth(
  referenceDate: Date = new Date(),
): CalendarMonth {
  const monthIndex = referenceDate.getUTCMonth();

  if (monthIndex === 0) {
    return {
      year: referenceDate.getUTCFullYear() - 1,
      month: 12,
    };
  }

  return {
    year: referenceDate.getUTCFullYear(),
    month: monthIndex,
  };
}

export function getIssueDateRangeForCalendarMonth(
  year: number,
  month: number,
): { start: Date; endExclusive: Date } {
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    endExclusive: new Date(Date.UTC(year, month, 1)),
  };
}
