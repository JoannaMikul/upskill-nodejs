import { z } from 'zod';

const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidCalendarDate(value: string): boolean {
  if (!CALENDAR_DATE_PATTERN.test(value)) {
    return false;
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

export function parseCalendarDate(value: string): Date {
  if (!isValidCalendarDate(value)) {
    throw new Error(`Invalid calendar date: ${value}`);
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));

  return new Date(Date.UTC(year, month - 1, day));
}

export const CalendarDateSchema = z
  .string()
  .regex(CALENDAR_DATE_PATTERN, 'Date must be in YYYY-MM-DD format')
  .refine(isValidCalendarDate, 'Invalid calendar date');

export type CalendarDate = z.infer<typeof CalendarDateSchema>;
