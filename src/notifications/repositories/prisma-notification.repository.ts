import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OutboundNotification } from '../model/outbound-notification';
import { NotificationRepository } from '../ports/notification-repository.port';

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(notification: OutboundNotification): Promise<void> {
    await this.prisma.notification.create({
      data: {
        customerId: notification.customerId,
        channel: notification.channel,
        recipient: notification.recipient,
        subject: notification.subject,
        body: notification.body,
      },
    });
  }
}
