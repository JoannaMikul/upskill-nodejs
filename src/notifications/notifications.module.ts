import { Module, type Provider } from '@nestjs/common';
import { PrismaNotificationRepository } from './repositories/prisma-notification.repository';
import type { NotificationRecipientResolver } from './ports/notification-recipient-resolver.port';
import type { NotificationSenderFactory } from './ports/notification-sender-factory.port';
import {
  NOTIFICATION_RECIPIENT_RESOLVER,
  NOTIFICATION_REPOSITORY,
  NOTIFICATION_SENDER_FACTORY,
} from './ports/notification.tokens';
import { CustomerNotificationRecipientResolver } from './services/customer-notification-recipient-resolver.service';
import { DefaultNotificationSenderFactory } from './services/notification-sender.factory';
import { EmailNotificationService } from './services/email-notification.service';
import { NotificationHandler } from './services/notification.handler';
import { SmsNotificationService } from './services/sms-notification.service';

const notificationSenderFactoryProvider: Provider<NotificationSenderFactory> = {
  provide: NOTIFICATION_SENDER_FACTORY,
  useClass: DefaultNotificationSenderFactory,
};

const notificationRecipientResolverProvider: Provider<NotificationRecipientResolver> =
  {
    provide: NOTIFICATION_RECIPIENT_RESOLVER,
    useClass: CustomerNotificationRecipientResolver,
  };

@Module({
  providers: [
    EmailNotificationService,
    SmsNotificationService,
    notificationSenderFactoryProvider,
    notificationRecipientResolverProvider,
    NotificationHandler,
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
  ],
  exports: [NotificationHandler, NOTIFICATION_RECIPIENT_RESOLVER],
})
export class NotificationsModule {}
