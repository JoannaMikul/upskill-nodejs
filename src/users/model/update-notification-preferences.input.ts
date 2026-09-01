import { NotificationChannel } from '@prisma/client';

export type UpdateNotificationPreferencesInput =
  | {
      notificationChannel: typeof NotificationChannel.EMAIL;
    }
  | {
      notificationChannel: typeof NotificationChannel.SMS;
      phoneNumber: string;
    };
