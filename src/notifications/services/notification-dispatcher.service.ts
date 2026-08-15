import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import type { NotificationSender } from '../ports/notification-sender.port';
import { EmailNotificationService } from './email-notification.service';
import { SmsNotificationService } from './sms-notification.service';

@Injectable()
export class NotificationDispatcherService {
  constructor(
    private readonly emailNotificationService: EmailNotificationService,
    private readonly smsNotificationService: SmsNotificationService,
  ) {}

  getSender(channel: NotificationChannel): NotificationSender {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return this.emailNotificationService;
      case NotificationChannel.SMS:
        return this.smsNotificationService;
    }
  }
}
