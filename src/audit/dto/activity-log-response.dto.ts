import type { ActivityLog } from '@prisma/client';

export type ActivityLogResponseDto = Pick<
  ActivityLog,
  'id' | 'accountId' | 'action' | 'invoiceId' | 'createdAt'
>;
