import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InvoiceReminderService } from './invoice-reminder.service';
import { isInvoiceReminderDay } from './utils/is-invoice-reminder-day';

@Injectable()
export class CronService {
  constructor(
    private readonly invoiceReminderService: InvoiceReminderService,
    private readonly configService: ConfigService,
  ) {}

  @Cron('0 9 * * *')
  async handleInvoiceReminder(): Promise<void> {
    if (this.configService.get<string>('CRON_ENABLED') === 'false') {
      return;
    }

    const today = new Date();

    if (!isInvoiceReminderDay(today)) {
      return;
    }

    await this.invoiceReminderService.run(today);
  }
}
