import type { ActivityLog } from '@prisma/client';
import type { ActivityLogResponseDto } from '../dto/activity-log-response.dto';

export function toActivityLogResponseDto(
  entry: ActivityLog,
): ActivityLogResponseDto {
  const { id, accountId, action, invoiceId, createdAt } = entry;
  return { id, accountId, action, invoiceId, createdAt };
}
