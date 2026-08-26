import { NotificationChannel } from '@prisma/client';
import type { NotificationSender } from './notification-sender.port';

export interface NotificationSenderFactory {
  create(channel: NotificationChannel): NotificationSender;
}
