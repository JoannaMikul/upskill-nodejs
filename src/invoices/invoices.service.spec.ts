import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { NotificationChannel, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InvoicesService } from './invoices.service';

const customers = [
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    accountId: '550e8400-e29b-41d4-a716-446655440001',
    notificationChannel: NotificationChannel.EMAIL,
    phoneNumber: null,
    account: {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'customer@example.com',
      passwordHash: 'hashed-password',
      role: Role.CUSTOMER,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
  },
];

describe('InvoicesService', () => {
  describe('findCustomersWithoutInvoiceForMonth', () => {
    const findMany = jest.fn();
    let invoicesService: InvoicesService;

    beforeEach(async () => {
      findMany.mockReset();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          InvoicesService,
          {
            provide: PrismaService,
            useValue: {
              customer: { findMany },
            },
          },
        ],
      }).compile();

      invoicesService = module.get(InvoicesService);
    });

    it('queries customers without invoice in the given month', async () => {
      findMany.mockResolvedValue(customers);

      const result = await invoicesService.findCustomersWithoutInvoiceForMonth(
        2026,
        0,
      );

      expect(findMany).toHaveBeenCalledWith({
        where: {
          invoices: {
            none: {
              createdAt: {
                gte: new Date(2026, 0, 1),
                lt: new Date(2026, 1, 1),
              },
            },
          },
        },
        include: { account: true },
      });
      expect(result).toEqual(customers);
    });

    it('builds month range for February using zero-based month index', async () => {
      findMany.mockResolvedValue([]);

      await invoicesService.findCustomersWithoutInvoiceForMonth(2026, 1);

      expect(findMany).toHaveBeenCalledWith({
        where: {
          invoices: {
            none: {
              createdAt: {
                gte: new Date(2026, 1, 1),
                lt: new Date(2026, 2, 1),
              },
            },
          },
        },
        include: { account: true },
      });
    });
  });
});
