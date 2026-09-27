import { NotificationChannel } from '@prisma/client';
import { InvoiceReminderService } from '../src/cron/invoice-reminder.service';
import type { TestActors, UserResponseDto } from './e2e-setup';
import {
  authHeader,
  createTestActors,
  e2eRequest,
  setupE2eSuite,
} from './e2e-setup';

const customerCredentials = {
  email: 'notify-customer@example.com',
  password: 'CustomerPass1234',
};

const phoneNumber = '+48123456789';

describe('Notifications', () => {
  const e2e = setupE2eSuite();
  let actors: TestActors;
  let referenceDate: Date;
  let monthLabel: string;

  beforeAll(async () => {
    actors = await createTestActors(e2e.app, customerCredentials);
    referenceDate = new Date();
    monthLabel = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      1,
    ).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  });

  it('updates preferences, sends reminder, and skips customer after invoice submission', async () => {
    const preferencesResponse = await e2eRequest(e2e.app)
      .patch('/users/me/notification-preferences')
      .set('Authorization', authHeader(actors.customerToken))
      .send({
        notificationChannel: NotificationChannel.SMS,
        phoneNumber,
      })
      .expect(200);

    expect(preferencesResponse.body as UserResponseDto).toMatchObject({
      id: actors.customer.id,
      email: customerCredentials.email,
      notificationChannel: NotificationChannel.SMS,
      phoneNumber,
    });

    const meResponse = await e2eRequest(e2e.app)
      .get('/users/me')
      .set('Authorization', authHeader(actors.customerToken))
      .expect(200);

    expect(meResponse.body as UserResponseDto).toMatchObject({
      notificationChannel: NotificationChannel.SMS,
      phoneNumber,
    });

    const reminderService = e2e.app.get(InvoiceReminderService);
    await reminderService.run(referenceDate);

    const customer = await e2e.prisma.customer.findUnique({
      where: { accountId: actors.customer.id },
    });

    expect(customer).not.toBeNull();

    let notifications = await e2e.prisma.notification.findMany({
      where: { customerId: customer!.id },
    });

    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({
      channel: NotificationChannel.SMS,
      recipient: phoneNumber,
      subject: 'Invoice reminder',
      body: `Reminder: you have not submitted an invoice for ${monthLabel}. Please submit it before month end.`,
    });

    await e2eRequest(e2e.app)
      .post('/invoices')
      .set('Authorization', authHeader(actors.customerToken))
      .expect(201);

    await reminderService.run(referenceDate);

    notifications = await e2e.prisma.notification.findMany({
      where: { customerId: customer!.id },
    });

    expect(notifications).toHaveLength(1);
  });
});
