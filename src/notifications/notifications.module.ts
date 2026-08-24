import { Module } from '@nestjs/common';
import { PrismaNotificationRepository } from './repositories/prisma-notification.repository';
import { NOTIFICATION_REPOSITORY } from './ports/notification.tokens';
import { EmailNotificationService } from './services/email-notification.service';
import { NotificationDispatcherService } from './services/notification-dispatcher.service';
import { NotificationHandler } from './services/notification.handler';
import { SmsNotificationService } from './services/sms-notification.service';

@Module({
  providers: [
    EmailNotificationService,
    SmsNotificationService,
    NotificationDispatcherService,
    NotificationHandler,
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
  ],
  exports: [NotificationHandler, NotificationDispatcherService],
})
export class NotificationsModule {}
