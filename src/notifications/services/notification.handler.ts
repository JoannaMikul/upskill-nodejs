import { Inject, Injectable } from '@nestjs/common';
import type { OutboundNotification } from '../model/outbound-notification';
import type { NotificationRepository } from '../ports/notification-repository.port';
import type { NotificationSenderFactory } from '../ports/notification-sender-factory.port';
import {
  NOTIFICATION_REPOSITORY,
  NOTIFICATION_SENDER_FACTORY,
} from '../ports/notification.tokens';

@Injectable()
export class NotificationHandler {
  constructor(
    @Inject(NOTIFICATION_SENDER_FACTORY)
    private readonly senderFactory: NotificationSenderFactory,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async handle(notification: OutboundNotification): Promise<void> {
    const sender = this.senderFactory.create(notification.channel);
    await sender.push(notification);
    await this.notificationRepository.save(notification);
  }
}
