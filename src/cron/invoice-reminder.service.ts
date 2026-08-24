import { Injectable } from '@nestjs/common';
import { Account, Customer, NotificationChannel } from '@prisma/client';
import { InvoicesService } from '../invoices/invoices.service';
import { OutboundNotification } from '../notifications/model/outbound-notification';
import { NotificationHandler } from '../notifications/services/notification.handler';

type CustomerWithAccount = Customer & { account: Account };

@Injectable()
export class InvoiceReminderService {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly notificationHandler: NotificationHandler,
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

  private buildNotification(
    customer: CustomerWithAccount,
    monthLabel: string,
  ): OutboundNotification {
    const body = `Reminder: you have not submitted an invoice for ${monthLabel}. Please submit it before month end.`;

    return {
      customerId: customer.id,
      channel: customer.notificationChannel,
      recipient: this.resolveRecipient(customer),
      subject: 'Invoice reminder',
      body,
    };
  }

  private resolveRecipient(customer: CustomerWithAccount): string {
    if (customer.notificationChannel === NotificationChannel.EMAIL) {
      return customer.account.email;
    }

    return customer.phoneNumber!;
  }
}
