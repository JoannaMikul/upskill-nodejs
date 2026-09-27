import { NotificationChannel } from '@prisma/client';
import type { NotificationSender } from '../ports/notification-sender.port';
import { DefaultNotificationSenderFactory } from './notification-sender.factory';

describe('DefaultNotificationSenderFactory', () => {
  const emailSender: NotificationSender = {
    push: jest.fn().mockResolvedValue(undefined),
  };
  const smsSender: NotificationSender = {
    push: jest.fn().mockResolvedValue(undefined),
  };

  const factory = new DefaultNotificationSenderFactory(emailSender, smsSender);

  it('creates email sender for EMAIL channel', () => {
    expect(factory.create(NotificationChannel.EMAIL)).toBe(emailSender);
  });

  it('creates sms sender for SMS channel', () => {
    expect(factory.create(NotificationChannel.SMS)).toBe(smsSender);
  });
});
