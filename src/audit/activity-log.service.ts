import { Injectable } from '@nestjs/common';
import { ActivityAction, type ActivityLog } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    accountId: string,
    action: ActivityAction,
    invoiceId?: string,
  ): Promise<ActivityLog> {
    return this.prisma.activityLog.create({
      data: {
        accountId,
        action,
        invoiceId,
      },
    });
  }
}
