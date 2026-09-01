import { NotificationChannel } from '@prisma/client';
import type { UpdateNotificationPreferences } from '../dto/update-notification-preferences.dto';
import { UpdateNotificationPreferencesInput } from '../model/update-notification-preferences.input';

export function mapUpdateNotificationPreferencesDtoToInput(
  dto: UpdateNotificationPreferences,
): UpdateNotificationPreferencesInput {
  if (dto.notificationChannel === NotificationChannel.SMS) {
    return {
      notificationChannel: NotificationChannel.SMS,
      phoneNumber: dto.phoneNumber,
    };
  }

  return { notificationChannel: NotificationChannel.EMAIL };
}
