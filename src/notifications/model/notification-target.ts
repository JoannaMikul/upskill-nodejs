import type { NotificationChannel } from '@prisma/client';

export type NotificationTarget = {
  customerId: string;
  channel: NotificationChannel;
  email: string;
  phoneNumber: string | null;
};
