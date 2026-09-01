import { NotificationChannel } from '@prisma/client';
import { z } from 'zod';

export const UpdateNotificationPreferencesSchema = z.discriminatedUnion(
  'notificationChannel',
  [
    z.object({
      notificationChannel: z.literal(NotificationChannel.EMAIL),
    }),
    z.object({
      notificationChannel: z.literal(NotificationChannel.SMS),
      phoneNumber: z.string().min(1),
    }),
  ],
);

export type UpdateNotificationPreferences = z.infer<
  typeof UpdateNotificationPreferencesSchema
>;
