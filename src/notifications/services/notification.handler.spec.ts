import { NotificationChannel } from '@prisma/client';
import { OutboundNotification } from '../model/outbound-notification';
import type { NotificationRepository } from '../ports/notification-repository.port';
import type { NotificationSender } from '../ports/notification-sender.port';
import { NotificationDispatcherService } from './notification-dispatcher.service';
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
  const getSender = jest.fn();
  const save = jest.fn().mockResolvedValue(undefined);

  const sender: NotificationSender = { push };
  const dispatcher = { getSender } as unknown as NotificationDispatcherService;
  const notificationRepository: NotificationRepository = { save };

  const handler = new NotificationHandler(dispatcher, notificationRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    getSender.mockReturnValue(sender);
  });

  it('selects sender by channel, pushes notification, then saves it', async () => {
    await handler.handle(notification);

    expect(getSender).toHaveBeenCalledWith(NotificationChannel.EMAIL);
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
