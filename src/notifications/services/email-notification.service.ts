import { Injectable } from '@nestjs/common';
import type { OutboundNotification } from '../model/outbound-notification';
import type { NotificationSender } from '../ports/notification-sender.port';

@Injectable()
export class EmailNotificationService implements NotificationSender {
  push(notification: OutboundNotification): Promise<void> {
    console.log('[EMAIL]', {
      to: notification.recipient,
      subject: notification.subject,
      body: notification.body,
    });

    return Promise.resolve();
  }
}
