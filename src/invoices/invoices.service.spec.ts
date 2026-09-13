import { ConflictException, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import {
  NotificationChannel,
  Prisma,
  Role,
  VatRate,
  type Contractor,
  type Invoice,
  type SellerProfile,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InvoicesService } from './invoices.service';
import type { CreateInvoiceInput } from './model/create-invoice.input';

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

const accountId = '550e8400-e29b-41d4-a716-446655440001';
const customerId = '550e8400-e29b-41d4-a716-446655440002';
const contractorId = '550e8400-e29b-41d4-a716-446655440010';
const sellerProfileId = '550e8400-e29b-41d4-a716-446655440020';

const mockSellerProfile: SellerProfile = {
  id: sellerProfileId,
  customerId,
  name: 'Seller Sp. z o.o.',
  nip: '1234567891',
  address: '1 Seller Street',
  bankAccountNumber: 'PL61109010140000071219812874',
};

const mockContractor: Contractor = {
  id: contractorId,
  name: 'Nike',
  nip: '9876543210',
  address: '1 Buyer Street',
  postalCode: '00-001',
  city: 'Warsaw',
  country: 'PL',
  email: null,
  phone: null,
  bankAccountNumber: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const createInput: CreateInvoiceInput = {
  buyerId: contractorId,
  invoiceNumber: 'FV/1/2026',
  issueDate: new Date(Date.UTC(2026, 8, 10)),
  saleDate: new Date(Date.UTC(2026, 8, 10)),
  lineItems: [
    {
      lineNumber: 1,
      name: 'IT Service',
      unitOfMeasure: 'pcs.',
      quantity: '2',
      unitNetPrice: '100',
      vatRate: VatRate.VAT_23,
    },
  ],
};

const mockInvoice: Invoice = {
  id: '550e8400-e29b-41d4-a716-446655440030',
  customerId,
  invoiceNumber: createInput.invoiceNumber,
  issueDate: createInput.issueDate,
  saleDate: createInput.saleDate,
  netAmount: new Prisma.Decimal('200.00'),
  vatAmount: new Prisma.Decimal('46.00'),
  grossAmount: new Prisma.Decimal('246.00'),
  status: 'ISSUED',
  verifiedAt: null,
  verifiedByAccountId: null,
  createdAt: new Date('2026-09-10T00:00:00.000Z'),
  updatedAt: new Date('2026-09-10T00:00:00.000Z'),
};

describe('InvoicesService', () => {
  describe('create', () => {
    const customerFindUnique = jest.fn();
    const contractorFindUnique = jest.fn();
    const invoiceFindUnique = jest.fn();
    const invoiceCreate = jest.fn();
    const $transaction = jest.fn();
    let invoicesService: InvoicesService;

    beforeEach(async () => {
      customerFindUnique.mockReset();
      contractorFindUnique.mockReset();
      invoiceFindUnique.mockReset();
      invoiceCreate.mockReset();
      $transaction.mockReset();

      $transaction.mockImplementation(
        (
          callback: (tx: {
            invoice: { create: typeof invoiceCreate };
          }) => unknown,
        ) => callback({ invoice: { create: invoiceCreate } }),
      );

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          InvoicesService,
          {
            provide: PrismaService,
            useValue: {
              customer: { findUnique: customerFindUnique, findMany: jest.fn() },
              contractor: { findUnique: contractorFindUnique },
              invoice: {
                findUnique: invoiceFindUnique,
              },
              $transaction,
            },
          },
        ],
      }).compile();

      invoicesService = module.get(InvoicesService);
    });

    it('creates invoice with snapshots, line items and calculated totals in a transaction', async () => {
      customerFindUnique.mockResolvedValue({
        id: customerId,
        accountId,
        sellerProfile: mockSellerProfile,
      });
      contractorFindUnique.mockResolvedValue(mockContractor);
      invoiceFindUnique.mockResolvedValue(null);
      invoiceCreate.mockResolvedValue(mockInvoice);

      const result = await invoicesService.create(accountId, createInput);

      expect(customerFindUnique).toHaveBeenCalledWith({
        where: { accountId },
        include: { sellerProfile: true },
      });
      expect(contractorFindUnique).toHaveBeenCalledWith({
        where: { id: contractorId },
      });
      expect(invoiceFindUnique).toHaveBeenCalledWith({
        where: {
          customerId_invoiceNumber: {
            customerId,
            invoiceNumber: createInput.invoiceNumber,
          },
        },
      });
      expect($transaction).toHaveBeenCalledTimes(1);
      expect(invoiceCreate).toHaveBeenCalledTimes(1);

      type InvoiceCreateCall = {
        data: {
          customerId: string;
          invoiceNumber: string;
          issueDate: Date;
          saleDate: Date;
          netAmount: Prisma.Decimal;
          vatAmount: Prisma.Decimal;
          grossAmount: Prisma.Decimal;
          seller: {
            create: {
              name: string;
              nip: string;
              address: string;
              bankAccountNumber: string | null;
            };
          };
          buyer: {
            create: {
              contractorId: string;
              name: string;
              nip: string;
              address: string;
              postalCode: string;
              city: string;
              country: string;
            };
          };
          lineItems: {
            create: Array<{
              lineNumber: number;
              name: string;
              unitOfMeasure: string;
              vatRate: VatRate;
              netAmount: Prisma.Decimal;
              vatAmount: Prisma.Decimal;
              grossAmount: Prisma.Decimal;
            }>;
          };
        };
      };

      const [[createCall]] = invoiceCreate.mock.calls as Array<
        [InvoiceCreateCall]
      >;

      expect(createCall.data.customerId).toBe(customerId);
      expect(createCall.data.invoiceNumber).toBe(createInput.invoiceNumber);
      expect(createCall.data.issueDate).toEqual(createInput.issueDate);
      expect(createCall.data.saleDate).toEqual(createInput.saleDate);
      expect(createCall.data.netAmount.toFixed(2)).toBe('200.00');
      expect(createCall.data.vatAmount.toFixed(2)).toBe('46.00');
      expect(createCall.data.grossAmount.toFixed(2)).toBe('246.00');
      expect(createCall.data.seller.create).toEqual({
        name: mockSellerProfile.name,
        nip: mockSellerProfile.nip,
        address: mockSellerProfile.address,
        bankAccountNumber: mockSellerProfile.bankAccountNumber,
      });
      expect(createCall.data.buyer.create).toEqual({
        contractorId: mockContractor.id,
        name: mockContractor.name,
        nip: mockContractor.nip,
        address: mockContractor.address,
        postalCode: mockContractor.postalCode,
        city: mockContractor.city,
        country: mockContractor.country,
      });
      expect(createCall.data.lineItems.create).toHaveLength(1);
      expect(createCall.data.lineItems.create[0]).toMatchObject({
        lineNumber: 1,
        name: 'IT Service',
        unitOfMeasure: 'pcs.',
        vatRate: VatRate.VAT_23,
      });
      expect(createCall.data.lineItems.create[0].netAmount.toFixed(2)).toBe(
        '200.00',
      );
      expect(result).toEqual(mockInvoice);
    });

    it('throws NotFoundException when customer profile is missing', async () => {
      customerFindUnique.mockResolvedValue(null);

      await expect(
        invoicesService.create(accountId, createInput),
      ).rejects.toThrow(new NotFoundException('Customer profile not found'));

      expect($transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when seller profile is missing', async () => {
      customerFindUnique.mockResolvedValue({
        id: customerId,
        accountId,
        sellerProfile: null,
      });

      await expect(
        invoicesService.create(accountId, createInput),
      ).rejects.toThrow(new NotFoundException('Seller profile not found'));

      expect($transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when contractor is missing', async () => {
      customerFindUnique.mockResolvedValue({
        id: customerId,
        accountId,
        sellerProfile: mockSellerProfile,
      });
      contractorFindUnique.mockResolvedValue(null);

      await expect(
        invoicesService.create(accountId, createInput),
      ).rejects.toThrow(new NotFoundException('Contractor not found'));

      expect($transaction).not.toHaveBeenCalled();
    });

    it('throws ConflictException when invoice number already exists for customer', async () => {
      customerFindUnique.mockResolvedValue({
        id: customerId,
        accountId,
        sellerProfile: mockSellerProfile,
      });
      contractorFindUnique.mockResolvedValue(mockContractor);
      invoiceFindUnique.mockResolvedValue(mockInvoice);

      await expect(
        invoicesService.create(accountId, createInput),
      ).rejects.toThrow(new ConflictException('Invoice number already exists'));

      expect($transaction).not.toHaveBeenCalled();
    });
  });

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
          account: {
            isActive: true,
          },
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
          account: {
            isActive: true,
          },
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
