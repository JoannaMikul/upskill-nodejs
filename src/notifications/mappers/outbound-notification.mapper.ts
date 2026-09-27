import type { OutboundNotification } from '../model/outbound-notification';
import type { NotificationTarget } from '../model/notification-target';
import type { NotificationRecipientResolver } from '../ports/notification-recipient-resolver.port';

export function toOutboundNotification(
  target: NotificationTarget,
  subject: string,
  body: string,
  resolver: NotificationRecipientResolver,
): OutboundNotification {
  return {
    customerId: target.customerId,
    channel: target.channel,
    recipient: resolver.resolve(target),
    subject,
    body,
  };
}
