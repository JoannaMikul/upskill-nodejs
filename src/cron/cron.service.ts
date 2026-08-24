import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InvoiceReminderService } from './invoice-reminder.service';
import { isInvoiceReminderDay } from './utils/is-invoice-reminder-day';

@Injectable()
export class CronService {
  constructor(
    private readonly invoiceReminderService: InvoiceReminderService,
  ) {}

  @Cron('0 9 * * *')
  async handleInvoiceReminder(): Promise<void> {
    const today = new Date();

    if (!isInvoiceReminderDay(today)) {
      return;
    }

    await this.invoiceReminderService.run(today);
  }
}
