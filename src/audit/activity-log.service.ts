import { Injectable } from '@nestjs/common';
import { ActivityAction, type ActivityLog } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ActivityLogListQuery } from './dto/activity-log-list-query.dto';

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

  async findActivityLogs(
    query: ActivityLogListQuery = {},
  ): Promise<ActivityLog[]> {
    return this.prisma.activityLog.findMany({
      where: query.accountId ? { accountId: query.accountId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }
}
