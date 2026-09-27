import type { OutboundNotification } from '../model/outbound-notification';

export interface NotificationRepository {
  save(notification: OutboundNotification): Promise<void>;
}
