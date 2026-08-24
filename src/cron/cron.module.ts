import { Module } from '@nestjs/common';
import { InvoicesModule } from '../invoices/invoices.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CronService } from './cron.service';
import { InvoiceReminderService } from './invoice-reminder.service';

@Module({
  imports: [InvoicesModule, NotificationsModule],
  providers: [CronService, InvoiceReminderService],
})
export class CronModule {}
