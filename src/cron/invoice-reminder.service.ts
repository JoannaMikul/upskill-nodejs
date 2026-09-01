import { Inject, Injectable } from '@nestjs/common';
import type { Account, Customer } from '@prisma/client';
import { InvoicesService } from '../invoices/invoices.service';
import { toOutboundNotification } from '../notifications/mappers/outbound-notification.mapper';
import type { NotificationRecipientResolver } from '../notifications/ports/notification-recipient-resolver.port';
import { NOTIFICATION_RECIPIENT_RESOLVER } from '../notifications/ports/notification.tokens';
import { NotificationHandler } from '../notifications/services/notification.handler';
import { mapCustomerToNotificationTarget } from './mappers/notification-target.mapper';

type CustomerWithAccount = Customer & { account: Account };

@Injectable()
export class InvoiceReminderService {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly notificationHandler: NotificationHandler,
    @Inject(NOTIFICATION_RECIPIENT_RESOLVER)
    private readonly recipientResolver: NotificationRecipientResolver,
  ) {}

  async run(referenceDate: Date = new Date()): Promise<void> {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();

    const customers =
      await this.invoicesService.findCustomersWithoutInvoiceForMonth(
        year,
        month,
      );

    const monthLabel = new Date(year, month, 1).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    for (const customer of customers) {
      const notification = this.buildNotification(customer, monthLabel);
      await this.notificationHandler.handle(notification);
    }
  }

  private buildNotification(customer: CustomerWithAccount, monthLabel: string) {
    const body = `Reminder: you have not submitted an invoice for ${monthLabel}. Please submit it before month end.`;
    const target = mapCustomerToNotificationTarget(customer);

    return toOutboundNotification(
      target,
      'Invoice reminder',
      body,
      this.recipientResolver,
    );
  }
}
