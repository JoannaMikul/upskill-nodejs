import { NotificationChannel } from '@prisma/client';
import { OutboundNotification } from '../model/outbound-notification';
import type { NotificationRepository } from '../ports/notification-repository.port';
import type { NotificationSender } from '../ports/notification-sender.port';
import type { NotificationSenderFactory } from '../ports/notification-sender-factory.port';
import { NotificationHandler } from './notification.handler';

const notification: OutboundNotification = {
  customerId: '550e8400-e29b-41d4-a716-446655440001',
  channel: NotificationChannel.EMAIL,
  recipient: 'customer@example.com',
  subject: 'Invoice reminder',
  body: 'Reminder: you have not submitted an invoice for January 2026.',
};

describe('NotificationHandler', () => {
  const push = jest.fn().mockResolvedValue(undefined);
  const create = jest.fn();
  const save = jest.fn().mockResolvedValue(undefined);

  const sender: NotificationSender = { push };
  const senderFactory = {
    create,
  } as unknown as NotificationSenderFactory;
  const notificationRepository: NotificationRepository = { save };

  const handler = new NotificationHandler(
    senderFactory,
    notificationRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    create.mockReturnValue(sender);
  });

  it('creates sender by channel, pushes notification, then saves it', async () => {
    await handler.handle(notification);

    expect(create).toHaveBeenCalledWith(NotificationChannel.EMAIL);
    expect(push).toHaveBeenCalledWith(notification);
    expect(save).toHaveBeenCalledWith(notification);
  });

  it('pushes notification before saving it', async () => {
    const callOrder: string[] = [];

    push.mockImplementation(() => {
      callOrder.push('push');
      return Promise.resolve();
    });
    save.mockImplementation(() => {
      callOrder.push('save');
      return Promise.resolve();
    });

    await handler.handle(notification);

    expect(callOrder).toEqual(['push', 'save']);
  });
});
