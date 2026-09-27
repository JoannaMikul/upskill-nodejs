import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '@prisma/client';
import type { NotificationTarget } from '../model/notification-target';
import type { NotificationRecipientResolver } from '../ports/notification-recipient-resolver.port';

@Injectable()
export class CustomerNotificationRecipientResolver implements NotificationRecipientResolver {
  resolve(target: NotificationTarget): string {
    if (target.channel === NotificationChannel.EMAIL) {
      return target.email;
    }

    return target.phoneNumber!;
  }
}
