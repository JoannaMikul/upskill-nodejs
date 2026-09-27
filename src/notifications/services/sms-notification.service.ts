import { Injectable } from '@nestjs/common';
import type { OutboundNotification } from '../model/outbound-notification';
import type { NotificationSender } from '../ports/notification-sender.port';

@Injectable()
export class SmsNotificationService implements NotificationSender {
  push(notification: OutboundNotification): Promise<void> {
    console.log('[SMS]', {
      to: notification.recipient,
      body: notification.body,
    });

    return Promise.resolve();
  }
}
