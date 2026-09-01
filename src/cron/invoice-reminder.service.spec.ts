import type { Account, Customer } from '@prisma/client';
import { NotificationChannel, Role } from '@prisma/client';
import { createMockAccount } from '../test/create-mock-account';
import type { InvoicesService } from '../invoices/invoices.service';
import type { NotificationHandler } from '../notifications/services/notification.handler';
import { CustomerNotificationRecipientResolver } from '../notifications/services/customer-notification-recipient-resolver.service';
import { InvoiceReminderService } from './invoice-reminder.service';

type CustomerWithAccount = Customer & { account: Account };

const REFERENCE_DATE = new Date(2026, 0, 28);
const REMINDER_SUBJECT = 'Invoice reminder';
const REMINDER_BODY =
  'Reminder: you have not submitted an invoice for January 2026. Please submit it before month end.';

const emailCustomerWithAccount: CustomerWithAccount = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  accountId: '550e8400-e29b-41d4-a716-446655440001',
  notificationChannel: NotificationChannel.EMAIL,
  phoneNumber: null,
  account: createMockAccount({
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'customer@example.com',
    role: Role.CUSTOMER,
  }),
};

const smsCustomerWithAccount: CustomerWithAccount = {
  id: '550e8400-e29b-41d4-a716-446655440004',
  accountId: '550e8400-e29b-41d4-a716-446655440003',
  notificationChannel: NotificationChannel.SMS,
  phoneNumber: '+48123456789',
  account: createMockAccount({
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'sms-customer@example.com',
    role: Role.CUSTOMER,
  }),
};

describe('InvoiceReminderService', () => {
  const findCustomersWithoutInvoiceForMonth = jest.fn();
  const handle = jest.fn().mockResolvedValue(undefined);
  const invoicesService = {
    findCustomersWithoutInvoiceForMonth,
  } as unknown as InvoicesService;

  const notificationHandler = {
    handle,
  } as unknown as NotificationHandler;

  const recipientResolver = new CustomerNotificationRecipientResolver();

  const service = new InvoiceReminderService(
    invoicesService,
    notificationHandler,
    recipientResolver,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queries customers without invoice for the reference date month', async () => {
    findCustomersWithoutInvoiceForMonth.mockResolvedValue([]);

    await service.run(REFERENCE_DATE);

    expect(findCustomersWithoutInvoiceForMonth).toHaveBeenCalledWith(2026, 0);
    expect(handle).not.toHaveBeenCalled();
  });

  it('sends email reminder to customers without invoice', async () => {
    findCustomersWithoutInvoiceForMonth.mockResolvedValue([
      emailCustomerWithAccount,
    ]);

    await service.run(REFERENCE_DATE);

    expect(handle).toHaveBeenCalledWith({
      customerId: emailCustomerWithAccount.id,
      channel: NotificationChannel.EMAIL,
      recipient: emailCustomerWithAccount.account.email,
      subject: REMINDER_SUBJECT,
      body: REMINDER_BODY,
    });
  });

  it('sends sms reminder using phone number as recipient', async () => {
    findCustomersWithoutInvoiceForMonth.mockResolvedValue([
      smsCustomerWithAccount,
    ]);

    await service.run(REFERENCE_DATE);

    expect(handle).toHaveBeenCalledWith({
      customerId: smsCustomerWithAccount.id,
      channel: NotificationChannel.SMS,
      recipient: smsCustomerWithAccount.phoneNumber,
      subject: REMINDER_SUBJECT,
      body: REMINDER_BODY,
    });
  });
});
