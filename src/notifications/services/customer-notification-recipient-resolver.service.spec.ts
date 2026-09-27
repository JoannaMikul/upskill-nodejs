import { NotificationChannel } from '@prisma/client';
import { CustomerNotificationRecipientResolver } from './customer-notification-recipient-resolver.service';

describe('CustomerNotificationRecipientResolver', () => {
  const resolver = new CustomerNotificationRecipientResolver();
  const customerId = '550e8400-e29b-41d4-a716-446655440002';

  it('resolves email for EMAIL channel', () => {
    expect(
      resolver.resolve({
        customerId,
        channel: NotificationChannel.EMAIL,
        email: 'customer@example.com',
        phoneNumber: null,
      }),
    ).toBe('customer@example.com');
  });

  it('resolves phone number for SMS channel', () => {
    expect(
      resolver.resolve({
        customerId,
        channel: NotificationChannel.SMS,
        email: 'customer@example.com',
        phoneNumber: '+48123456789',
      }),
    ).toBe('+48123456789');
  });
});
