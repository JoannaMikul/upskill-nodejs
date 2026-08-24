export function isInvoiceReminderDay(date: Date): boolean {
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  return date.getDate() === lastDay - 3;
}
