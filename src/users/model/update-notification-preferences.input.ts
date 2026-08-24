import { NotificationChannel } from '@prisma/client';

export type UpdateNotificationPreferencesInput = {
  notificationChannel: NotificationChannel;
  phoneNumber?: string;
};
