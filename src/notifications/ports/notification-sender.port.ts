import type { OutboundNotification } from '../model/outbound-notification';

export interface NotificationSender {
  push(notification: OutboundNotification): Promise<void>;
}
