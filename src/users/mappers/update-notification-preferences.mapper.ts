import { UpdateNotificationPreferencesDto } from '../dto/update-notification-preferences.dto';
import { UpdateNotificationPreferencesInput } from '../model/update-notification-preferences.input';

export function mapUpdateNotificationPreferencesDtoToInput(
  dto: UpdateNotificationPreferencesDto,
): UpdateNotificationPreferencesInput {
  return {
    notificationChannel: dto.notificationChannel,
    phoneNumber: dto.phoneNumber,
  };
}
