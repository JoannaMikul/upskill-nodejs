import type { InjectionToken } from '@nestjs/common';
import type { NotificationRecipientResolver } from './notification-recipient-resolver.port';
import type { NotificationRepository } from './notification-repository.port';
import type { NotificationSenderFactory } from './notification-sender-factory.port';

export const NOTIFICATION_REPOSITORY: InjectionToken<NotificationRepository> =
  'NOTIFICATION_REPOSITORY';

export const NOTIFICATION_SENDER_FACTORY: InjectionToken<NotificationSenderFactory> =
  'NOTIFICATION_SENDER_FACTORY';

export const NOTIFICATION_RECIPIENT_RESOLVER: InjectionToken<NotificationRecipientResolver> =
  'NOTIFICATION_RECIPIENT_RESOLVER';
