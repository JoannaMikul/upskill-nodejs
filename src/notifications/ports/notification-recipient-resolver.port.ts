import type { NotificationTarget } from '../model/notification-target';

export interface NotificationRecipientResolver {
  resolve(target: NotificationTarget): string;
}
