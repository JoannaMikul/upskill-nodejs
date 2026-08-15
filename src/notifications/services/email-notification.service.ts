import { Injectable } from '@nestjs/common';
import { OutboundNotification } from '../model/outbound-notification';
import { NotificationSender } from '../ports/notification-sender.port';

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
