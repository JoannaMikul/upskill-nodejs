import { Module, type Provider } from '@nestjs/common';
import { PrismaNotificationRepository } from './repositories/prisma-notification.repository';
import type { NotificationSenderFactory } from './ports/notification-sender-factory.port';
import {
  NOTIFICATION_REPOSITORY,
  NOTIFICATION_SENDER_FACTORY,
} from './ports/notification.tokens';
import { DefaultNotificationSenderFactory } from './services/notification-sender.factory';
import { EmailNotificationService } from './services/email-notification.service';
import { NotificationHandler } from './services/notification.handler';
import { SmsNotificationService } from './services/sms-notification.service';

const notificationSenderFactoryProvider: Provider<NotificationSenderFactory> = {
  provide: NOTIFICATION_SENDER_FACTORY,
  useClass: DefaultNotificationSenderFactory,
};

@Module({
  providers: [
    EmailNotificationService,
    SmsNotificationService,
    notificationSenderFactoryProvider,
    NotificationHandler,
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
  ],
  exports: [NotificationHandler],
})
export class NotificationsModule {}
