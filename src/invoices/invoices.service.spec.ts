import { ConflictException, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import {
  InvoiceStatus,
  NotificationChannel,
  Prisma,
  Role,
  VatRate,
  type Contractor,
  type Invoice,
  type SellerProfile,
} from '@prisma/client';
import {
  calculateInvoiceTotals,
  calculateLineAmounts,
} from '../common/validation/invoice-amounts';
import { PrismaService } from '../prisma/prisma.service';
import {
  invoiceDetailsInclude,
  type InvoiceWithDetails,
} from './model/invoice-with-details';
import { InvoicesService } from './invoices.service';
import type { CreateInvoiceInput } from './model/create-invoice.input';
import type { UpdateInvoiceInput } from './model/update-invoice.input';

type InvoiceUpdateHandler = {
  update(
    accountId: string,
    invoiceId: string,
    input: UpdateInvoiceInput,
  ): Promise<InvoiceWithDetails>;
};

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

const createLineItemInput = {
  lineNumber: 1,
  name: 'IT Service',
  unitOfMeasure: 'pcs.',
  quantity: '1',
  unitNetPrice: '200.45',
  vatRate: VatRate.VAT_23,
};

const calculatedLineAmounts = calculateLineAmounts({
  quantity: createLineItemInput.quantity,
  unitNetPrice: createLineItemInput.unitNetPrice,
  vatRate: createLineItemInput.vatRate,
});

const calculatedInvoiceTotals = calculateInvoiceTotals([calculatedLineAmounts]);

const createInput: CreateInvoiceInput = {
  buyerId: contractorId,
  invoiceNumber: 'FV/1/2026',
  issueDate: new Date(Date.UTC(2026, 8, 10)),
  saleDate: new Date(Date.UTC(2026, 8, 10)),
  lineItems: [createLineItemInput],
};

const mockInvoice: Invoice = {
  id: '550e8400-e29b-41d4-a716-446655440030',
  customerId,
  invoiceNumber: createInput.invoiceNumber,
  issueDate: createInput.issueDate,
  saleDate: createInput.saleDate,
  netAmount: calculatedInvoiceTotals.netAmount,
  vatAmount: calculatedInvoiceTotals.vatAmount,
  grossAmount: calculatedInvoiceTotals.grossAmount,
  status: 'ISSUED',
  verifiedAt: null,
  verifiedByAccountId: null,
  createdAt: new Date('2026-09-10T00:00:00.000Z'),
  updatedAt: new Date('2026-09-10T00:00:00.000Z'),
};

const mockInvoiceWithDetails: InvoiceWithDetails = {
  ...mockInvoice,
  seller: {
    id: '550e8400-e29b-41d4-a716-446655440031',
    invoiceId: mockInvoice.id,
    name: mockSellerProfile.name,
    nip: mockSellerProfile.nip,
    address: mockSellerProfile.address,
    bankAccountNumber: mockSellerProfile.bankAccountNumber,
  },
  buyer: {
    id: '550e8400-e29b-41d4-a716-446655440032',
    invoiceId: mockInvoice.id,
    contractorId: mockContractor.id,
    name: mockContractor.name,
    nip: mockContractor.nip,
    address: mockContractor.address,
    postalCode: mockContractor.postalCode,
    city: mockContractor.city,
    country: mockContractor.country,
  },
  lineItems: [
    {
      id: '550e8400-e29b-41d4-a716-446655440033',
      invoiceId: mockInvoice.id,
      lineNumber: 1,
      name: 'IT Service',
      unitOfMeasure: 'pcs.',
      quantity: new Prisma.Decimal(createLineItemInput.quantity),
      unitNetPrice: new Prisma.Decimal(createLineItemInput.unitNetPrice),
      vatRate: VatRate.VAT_23,
      netAmount: calculatedLineAmounts.netAmount,
      vatAmount: calculatedLineAmounts.vatAmount,
      grossAmount: calculatedLineAmounts.grossAmount,
    },
  ],
};

const updateInput: UpdateInvoiceInput = {
  buyerId: contractorId,
  invoiceNumber: 'FV/2/2026',
  issueDate: createInput.issueDate,
  saleDate: createInput.saleDate,
  lineItems: [
    {
      lineNumber: 1,
      name: 'Updated Service',
      unitOfMeasure: 'h',
      quantity: '3',
      unitNetPrice: '50',
      vatRate: VatRate.VAT_23,
    },
  ],
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

      invoicesService = module.get<InvoicesService>(InvoicesService);
    });

    it('creates invoice with snapshots, line items and calculated totals in a transaction', async () => {
      customerFindUnique.mockResolvedValue({
        id: customerId,
        accountId,
        sellerProfile: mockSellerProfile,
      });
      contractorFindUnique.mockResolvedValue(mockContractor);
      invoiceFindUnique.mockResolvedValue(null);
      invoiceCreate.mockResolvedValue(mockInvoiceWithDetails);

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
      expect(createCall.data.netAmount.toFixed(2)).toBe(
        calculatedInvoiceTotals.netAmount.toFixed(2),
      );
      expect(createCall.data.vatAmount.toFixed(2)).toBe(
        calculatedInvoiceTotals.vatAmount.toFixed(2),
      );
      expect(createCall.data.grossAmount.toFixed(2)).toBe(
        calculatedInvoiceTotals.grossAmount.toFixed(2),
      );
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
        calculatedLineAmounts.netAmount.toFixed(2),
      );
      expect(result).toEqual(mockInvoiceWithDetails);
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

  describe('update', () => {
    const customerFindUnique = jest.fn();
    const contractorFindUnique = jest.fn();
    const invoiceFindUnique = jest.fn();
    const invoiceUpdate = jest.fn();
    const $transaction = jest.fn();
    let invoiceUpdateHandler: InvoiceUpdateHandler;

    beforeEach(async () => {
      customerFindUnique.mockReset();
      contractorFindUnique.mockReset();
      invoiceFindUnique.mockReset();
      invoiceUpdate.mockReset();
      $transaction.mockReset();

      $transaction.mockImplementation(
        (
          callback: (tx: {
            invoice: { update: typeof invoiceUpdate };
          }) => unknown,
        ) => callback({ invoice: { update: invoiceUpdate } }),
      );

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          InvoicesService,
          {
            provide: PrismaService,
            useValue: {
              customer: { findUnique: customerFindUnique },
              contractor: { findUnique: contractorFindUnique },
              invoice: {
                findUnique: invoiceFindUnique,
              },
              $transaction,
            },
          },
        ],
      }).compile();

      invoiceUpdateHandler = module.get<InvoicesService>(InvoicesService);
    });

    it('replaces line items and recalculates totals in a transaction when ISSUED', async () => {
      customerFindUnique.mockResolvedValue({
        id: customerId,
        accountId,
        sellerProfile: mockSellerProfile,
      });
      invoiceFindUnique.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.ISSUED,
      });
      contractorFindUnique.mockResolvedValue(mockContractor);
      invoiceUpdate.mockResolvedValue({
        ...mockInvoiceWithDetails,
        invoiceNumber: updateInput.invoiceNumber,
      });

      await invoiceUpdateHandler.update(accountId, mockInvoice.id, updateInput);

      expect(invoiceFindUnique).toHaveBeenCalledWith({
        where: { id: mockInvoice.id },
      });
      expect($transaction).toHaveBeenCalledTimes(1);
      expect(invoiceUpdate).toHaveBeenCalledTimes(1);

      type InvoiceUpdateCall = {
        where: { id: string };
        include: typeof invoiceDetailsInclude;
        data: {
          invoiceNumber: string;
          lineItems: {
            deleteMany: Record<string, never>;
            create: Array<{ name: string }>;
          };
        };
      };

      const [[updateCall]] = invoiceUpdate.mock.calls as Array<
        [InvoiceUpdateCall]
      >;

      expect(updateCall.where.id).toBe(mockInvoice.id);
      expect(updateCall.data.invoiceNumber).toBe(updateInput.invoiceNumber);
      expect(updateCall.data.lineItems.deleteMany).toEqual({});
      expect(updateCall.data.lineItems.create).toHaveLength(1);
      expect(updateCall.data.lineItems.create[0].name).toBe('Updated Service');
    });

    it('throws NotFoundException when invoice is missing or not owned', async () => {
      customerFindUnique.mockResolvedValue({
        id: customerId,
        accountId,
        sellerProfile: mockSellerProfile,
      });
      invoiceFindUnique.mockResolvedValue(null);

      await expect(
        invoiceUpdateHandler.update(accountId, mockInvoice.id, updateInput),
      ).rejects.toThrow(new NotFoundException('Invoice not found'));

      invoiceFindUnique.mockResolvedValue({
        ...mockInvoice,
        customerId: 'other-customer',
        status: InvoiceStatus.ISSUED,
      });

      await expect(
        invoiceUpdateHandler.update(accountId, mockInvoice.id, updateInput),
      ).rejects.toThrow(new NotFoundException('Invoice not found'));

      expect($transaction).not.toHaveBeenCalled();
    });

    it('throws ConflictException when invoice is VERIFIED', async () => {
      customerFindUnique.mockResolvedValue({
        id: customerId,
        accountId,
        sellerProfile: mockSellerProfile,
      });
      invoiceFindUnique.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.VERIFIED,
      });

      await expect(
        invoiceUpdateHandler.update(accountId, mockInvoice.id, updateInput),
      ).rejects.toThrow(
        new ConflictException('Verified invoice cannot be updated'),
      );

      expect($transaction).not.toHaveBeenCalled();
    });

    it('throws ConflictException when new invoice number already exists', async () => {
      customerFindUnique.mockResolvedValue({
        id: customerId,
        accountId,
        sellerProfile: mockSellerProfile,
      });
      invoiceFindUnique
        .mockResolvedValueOnce({
          ...mockInvoice,
          status: InvoiceStatus.ISSUED,
        })
        .mockResolvedValueOnce({ id: 'other-invoice-id' });
      contractorFindUnique.mockResolvedValue(mockContractor);

      await expect(
        invoiceUpdateHandler.update(accountId, mockInvoice.id, {
          ...updateInput,
          invoiceNumber: 'FV/TAKEN/2026',
        }),
      ).rejects.toThrow(new ConflictException('Invoice number already exists'));

      expect($transaction).not.toHaveBeenCalled();
    });
  });

  describe('findMyInvoices', () => {
    const customerFindUnique = jest.fn();
    const invoiceFindMany = jest.fn();
    let invoicesService: InvoicesService;

    beforeEach(async () => {
      customerFindUnique.mockReset();
      invoiceFindMany.mockReset();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          InvoicesService,
          {
            provide: PrismaService,
            useValue: {
              customer: { findUnique: customerFindUnique },
              invoice: { findMany: invoiceFindMany },
            },
          },
        ],
      }).compile();

      invoicesService = module.get<InvoicesService>(InvoicesService);
    });

    it('returns customer invoices with details ordered by createdAt desc', async () => {
      customerFindUnique.mockResolvedValue({ id: customerId, accountId });
      invoiceFindMany.mockResolvedValue([mockInvoiceWithDetails]);

      const result = await invoicesService.findMyInvoices(accountId);

      expect(customerFindUnique).toHaveBeenCalledWith({
        where: { accountId },
      });
      expect(invoiceFindMany).toHaveBeenCalledWith({
        where: { customerId },
        include: invoiceDetailsInclude,
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockInvoiceWithDetails]);
    });

    it('throws NotFoundException when customer profile is missing', async () => {
      customerFindUnique.mockResolvedValue(null);

      await expect(invoicesService.findMyInvoices(accountId)).rejects.toThrow(
        new NotFoundException('Customer profile not found'),
      );
    });
  });

  describe('findForManager', () => {
    const invoiceFindMany = jest.fn();
    let invoicesService: InvoicesService;

    beforeEach(async () => {
      invoiceFindMany.mockReset();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          InvoicesService,
          {
            provide: PrismaService,
            useValue: {
              invoice: { findMany: invoiceFindMany },
            },
          },
        ],
      }).compile();

      invoicesService = module.get<InvoicesService>(InvoicesService);
    });

    it('filters by issueDate for explicit year and month', async () => {
      invoiceFindMany.mockResolvedValue([mockInvoiceWithDetails]);

      const result = await invoicesService.findForManager({
        year: 2026,
        month: 8,
      });

      expect(invoiceFindMany).toHaveBeenCalledWith({
        where: {
          issueDate: {
            gte: new Date(Date.UTC(2026, 7, 1)),
            lt: new Date(Date.UTC(2026, 8, 1)),
          },
        },
        include: invoiceDetailsInclude,
        orderBy: { issueDate: 'desc' },
      });
      expect(result).toEqual([mockInvoiceWithDetails]);
    });

    it('defaults to previous calendar month when query is empty', async () => {
      jest.useFakeTimers({ now: new Date(Date.UTC(2026, 8, 17)) });
      invoiceFindMany.mockResolvedValue([]);

      await invoicesService.findForManager({});

      expect(invoiceFindMany).toHaveBeenCalledWith({
        where: {
          issueDate: {
            gte: new Date(Date.UTC(2026, 7, 1)),
            lt: new Date(Date.UTC(2026, 8, 1)),
          },
        },
        include: invoiceDetailsInclude,
        orderBy: { issueDate: 'desc' },
      });

      jest.useRealTimers();
    });
  });

  describe('verify', () => {
    const invoiceFindUnique = jest.fn();
    const invoiceUpdate = jest.fn();
    let invoicesService: InvoicesService;
    const managerAccountId = 'manager-account-id';

    beforeEach(async () => {
      invoiceFindUnique.mockReset();
      invoiceUpdate.mockReset();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          InvoicesService,
          {
            provide: PrismaService,
            useValue: {
              invoice: {
                findUnique: invoiceFindUnique,
                update: invoiceUpdate,
              },
            },
          },
        ],
      }).compile();

      invoicesService = module.get<InvoicesService>(InvoicesService);
    });

    it('marks invoice as VERIFIED with verifier metadata', async () => {
      invoiceFindUnique.mockResolvedValue({
        ...mockInvoiceWithDetails,
        status: InvoiceStatus.ISSUED,
      });
      invoiceUpdate.mockResolvedValue({
        ...mockInvoiceWithDetails,
        status: InvoiceStatus.VERIFIED,
        verifiedByAccountId: managerAccountId,
        verifiedAt: new Date('2026-09-17T10:00:00.000Z'),
      });

      const result = await invoicesService.verify(
        managerAccountId,
        mockInvoice.id,
      );

      expect(invoiceUpdate).toHaveBeenCalledWith({
        where: { id: mockInvoice.id },
        include: invoiceDetailsInclude,
        data: {
          status: InvoiceStatus.VERIFIED,
          verifiedAt: expect.any(Date) as Date,
          verifiedByAccountId: managerAccountId,
        },
      });
      expect(result.status).toBe(InvoiceStatus.VERIFIED);
    });

    it('returns existing invoice without update when already VERIFIED', async () => {
      const verifiedInvoice = {
        ...mockInvoiceWithDetails,
        status: InvoiceStatus.VERIFIED,
        verifiedByAccountId: managerAccountId,
        verifiedAt: new Date('2026-09-16T10:00:00.000Z'),
      };
      invoiceFindUnique.mockResolvedValue(verifiedInvoice);

      const result = await invoicesService.verify(
        managerAccountId,
        mockInvoice.id,
      );

      expect(invoiceUpdate).not.toHaveBeenCalled();
      expect(result).toEqual(verifiedInvoice);
    });

    it('throws NotFoundException when invoice is missing', async () => {
      invoiceFindUnique.mockResolvedValue(null);

      await expect(
        invoicesService.verify(managerAccountId, mockInvoice.id),
      ).rejects.toThrow(new NotFoundException('Invoice not found'));
    });
  });

  describe('findById', () => {
    const customerFindUnique = jest.fn();
    const invoiceFindUnique = jest.fn();
    let invoicesService: InvoicesService;

    beforeEach(async () => {
      customerFindUnique.mockReset();
      invoiceFindUnique.mockReset();

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          InvoicesService,
          {
            provide: PrismaService,
            useValue: {
              customer: { findUnique: customerFindUnique },
              invoice: { findUnique: invoiceFindUnique },
            },
          },
        ],
      }).compile();

      invoicesService = module.get<InvoicesService>(InvoicesService);
    });

    it('returns invoice for owning customer', async () => {
      invoiceFindUnique.mockResolvedValue(mockInvoiceWithDetails);
      customerFindUnique.mockResolvedValue({ id: customerId, accountId });

      const result = await invoicesService.findById(
        accountId,
        Role.CUSTOMER,
        mockInvoice.id,
      );

      expect(invoiceFindUnique).toHaveBeenCalledWith({
        where: { id: mockInvoice.id },
        include: invoiceDetailsInclude,
      });
      expect(customerFindUnique).toHaveBeenCalledWith({
        where: { accountId },
      });
      expect(result).toEqual(mockInvoiceWithDetails);
    });

    it('returns invoice for manager without ownership check', async () => {
      invoiceFindUnique.mockResolvedValue(mockInvoiceWithDetails);

      const result = await invoicesService.findById(
        'manager-account-id',
        Role.MANAGER,
        mockInvoice.id,
      );

      expect(customerFindUnique).not.toHaveBeenCalled();
      expect(result).toEqual(mockInvoiceWithDetails);
    });

    it('throws NotFoundException when invoice is missing', async () => {
      invoiceFindUnique.mockResolvedValue(null);

      await expect(
        invoicesService.findById(accountId, Role.CUSTOMER, mockInvoice.id),
      ).rejects.toThrow(new NotFoundException('Invoice not found'));
    });

    it('throws NotFoundException when customer does not own the invoice', async () => {
      invoiceFindUnique.mockResolvedValue(mockInvoiceWithDetails);
      customerFindUnique.mockResolvedValue({
        id: 'other-customer-id',
        accountId,
      });

      await expect(
        invoicesService.findById(accountId, Role.CUSTOMER, mockInvoice.id),
      ).rejects.toThrow(new NotFoundException('Invoice not found'));
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

      invoicesService = module.get<InvoicesService>(InvoicesService);
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
