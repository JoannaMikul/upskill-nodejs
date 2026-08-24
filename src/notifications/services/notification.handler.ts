import { Inject, Injectable } from '@nestjs/common';
import { OutboundNotification } from '../model/outbound-notification';
import type { NotificationRepository } from '../ports/notification-repository.port';
import { NOTIFICATION_REPOSITORY } from '../ports/notification.tokens';
import { NotificationDispatcherService } from './notification-dispatcher.service';

@Injectable()
export class NotificationHandler {
  constructor(
    private readonly dispatcher: NotificationDispatcherService,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async handle(notification: OutboundNotification): Promise<void> {
    const sender = this.dispatcher.getSender(notification.channel);
    await sender.push(notification);
    await this.notificationRepository.save(notification);
  }
}
