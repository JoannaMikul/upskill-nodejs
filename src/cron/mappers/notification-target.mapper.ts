import type { Account, Customer } from '@prisma/client';
import type { NotificationTarget } from '../../notifications/model/notification-target';

type CustomerWithAccount = Customer & { account: Account };

export function mapCustomerToNotificationTarget(
  customer: CustomerWithAccount,
): NotificationTarget {
  return {
    customerId: customer.id,
    channel: customer.notificationChannel,
    email: customer.account.email,
    phoneNumber: customer.phoneNumber,
  };
}
