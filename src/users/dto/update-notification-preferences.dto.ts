import { NotificationChannel } from '@prisma/client';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const UpdateNotificationPreferencesSchema = z
  .object({
    notificationChannel: z.enum(NotificationChannel),
    phoneNumber: z.string().min(1).optional(),
  })
  .refine(
    (data) =>
      data.notificationChannel !== NotificationChannel.SMS ||
      data.phoneNumber != null,
    {
      message: 'phoneNumber is required when notification channel is SMS',
      path: ['phoneNumber'],
    },
  );

export class UpdateNotificationPreferencesDto extends createZodDto(
  UpdateNotificationPreferencesSchema,
) {}
