import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import type { NotificationSenderFactory } from '../ports/notification-sender-factory.port';
import type { NotificationSender } from '../ports/notification-sender.port';
import { EmailNotificationService } from './email-notification.service';
import { SmsNotificationService } from './sms-notification.service';

@Injectable()
export class DefaultNotificationSenderFactory implements NotificationSenderFactory {
  private readonly senders: Record<NotificationChannel, NotificationSender>;

  constructor(
    emailNotificationService: EmailNotificationService,
    smsNotificationService: SmsNotificationService,
  ) {
    this.senders = {
      [NotificationChannel.EMAIL]: emailNotificationService,
      [NotificationChannel.SMS]: smsNotificationService,
    };
  }

  create(channel: NotificationChannel): NotificationSender {
    return this.senders[channel];
  }
}
