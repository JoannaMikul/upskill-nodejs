import { Injectable } from '@nestjs/common';
import { OutboundNotification } from '../model/outbound-notification';
import { NotificationSender } from '../ports/notification-sender.port';

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
