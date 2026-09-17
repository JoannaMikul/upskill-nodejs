import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ActivityAction, type ActivityLog } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from './activity-log.service';

const accountId = '550e8400-e29b-41d4-a716-446655440001';
const invoiceId = '550e8400-e29b-41d4-a716-446655440030';

const mockActivityLog: ActivityLog = {
  id: '550e8400-e29b-41d4-a716-446655440040',
  accountId,
  action: ActivityAction.LOGIN,
  invoiceId: null,
  createdAt: new Date('2026-09-17T10:00:00.000Z'),
};

describe('ActivityLogService', () => {
  const create = jest.fn();
  let activityLogService: ActivityLogService;

  beforeEach(async () => {
    create.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityLogService,
        {
          provide: PrismaService,
          useValue: {
            activityLog: { create },
          },
        },
      ],
    }).compile();

    activityLogService = module.get(ActivityLogService);
  });

  describe('log', () => {
    it('persists activity with accountId and action', async () => {
      create.mockResolvedValue(mockActivityLog);

      const result = await activityLogService.log(
        accountId,
        ActivityAction.LOGIN,
      );

      expect(create).toHaveBeenCalledWith({
        data: {
          accountId,
          action: ActivityAction.LOGIN,
          invoiceId: undefined,
        },
      });
      expect(result).toEqual(mockActivityLog);
    });

    it('persists optional invoiceId for invoice-related actions', async () => {
      const invoiceLog: ActivityLog = {
        ...mockActivityLog,
        action: ActivityAction.INVOICE_CREATED,
        invoiceId,
      };
      create.mockResolvedValue(invoiceLog);

      const result = await activityLogService.log(
        accountId,
        ActivityAction.INVOICE_CREATED,
        invoiceId,
      );

      expect(create).toHaveBeenCalledWith({
        data: {
          accountId,
          action: ActivityAction.INVOICE_CREATED,
          invoiceId,
        },
      });
      expect(result.invoiceId).toBe(invoiceId);
    });
  });
});
