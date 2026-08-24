import { NotificationChannel } from '@prisma/client';

export type OutboundNotification = {
  customerId: string;
  channel: NotificationChannel;
  recipient: string;
  subject: string;
  body: string;
};
