import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { Role, NotificationChannel } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  createMockAccount,
  MOCK_ACCOUNT_ID,
} from '../test/create-mock-account';
import { createUsersServiceTestContext } from '../test/create-users-service-test-context';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

jest.mock('bcrypt');

const accountFindUnique = jest.fn();
const accountFindMany = jest.fn();
const accountUpdate = jest.fn();
const sellerProfileFindUnique = jest.fn();
const sellerProfileUpsert = jest.fn();
const accountFindUniqueOrThrow = jest.fn();

async function createUsersServiceWithSharedMocks(): Promise<UsersService> {
  accountFindUnique.mockReset();
  accountFindMany.mockReset();
  accountUpdate.mockReset();
  sellerProfileFindUnique.mockReset();
  sellerProfileUpsert.mockReset();
  accountFindUniqueOrThrow.mockReset();

  const prismaService = {
    account: {
      findUnique: accountFindUnique,
      findMany: accountFindMany,
      update: accountUpdate,
      upsert: jest.fn(),
      findUniqueOrThrow: accountFindUniqueOrThrow,
    },
    manager: {
      upsert: jest.fn(),
    },
    customer: {
      update: jest.fn(),
    },
    sellerProfile: {
      findUnique: sellerProfileFindUnique,
      upsert: sellerProfileUpsert,
    },
    $transaction: jest.fn(),
  };

  prismaService.$transaction.mockImplementation(
    (callback: (tx: typeof prismaService) => unknown) =>
      callback(prismaService),
  );

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      UsersService,
      { provide: PrismaService, useValue: prismaService },
    ],
  }).compile();

  return module.get(UsersService);
}

describe('UsersService', () => {
  describe('findById', () => {
    it('returns account when found', async () => {
      const { usersService, prismaService } =
        await createUsersServiceTestContext();
      const mockAccount = createMockAccount({ role: Role.MANAGER });

      prismaService.account.findUnique.mockResolvedValue(mockAccount);

      const result = await usersService.findById(MOCK_ACCOUNT_ID);

      expect(prismaService.account.findUnique).toHaveBeenCalledWith({
        where: { id: MOCK_ACCOUNT_ID },
        include: {
          customer: {
            include: {
              sellerProfile: true,
            },
          },
        },
      });
      expect(result).toEqual(mockAccount);
    });

    it('rejects findById when user does not exist with NotFoundException', async () => {
      const { usersService, prismaService } =
        await createUsersServiceTestContext();

      prismaService.account.findUnique.mockResolvedValue(null);

      await expect(
        usersService.findById('00000000-0000-0000-0000-000000000001'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('returns account on exact match with lowercase normalization', async () => {
      const { usersService, prismaService } =
        await createUsersServiceTestContext();
      const mockAccount = createMockAccount({ role: Role.MANAGER });

      prismaService.account.findUnique.mockResolvedValue(mockAccount);

      const result = await usersService.findByEmail('Test@Example.com');

      expect(prismaService.account.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: {
          customer: {
            include: {
              sellerProfile: true,
            },
          },
        },
      });
      expect(result).toEqual(mockAccount);
    });

    it('rejects findByEmail when no user matches the address with NotFoundException', async () => {
      const { usersService, prismaService } =
        await createUsersServiceTestContext();

      prismaService.account.findUnique.mockResolvedValue(null);

      await expect(
        usersService.findByEmail('unknown@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('seedManager', () => {
    it('upserts manager account and linked manager profile', async () => {
      const { usersService, prismaService } =
        await createUsersServiceTestContext();
      const mockAccount = createMockAccount({
        role: Role.MANAGER,
        email: 'manager@example.com',
      });

      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prismaService.account.upsert.mockResolvedValue(mockAccount);
      prismaService.manager.upsert.mockResolvedValue({
        id: 'manager-profile-id',
        accountId: mockAccount.id,
      });

      const result = await usersService.seedManager(
        'Manager@Example.com',
        'ManagerPass123',
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('ManagerPass123', 12);
      expect(prismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaService.account.upsert).toHaveBeenCalledWith({
        where: { email: 'manager@example.com' },
        update: {
          passwordHash: 'hashed-password',
          role: Role.MANAGER,
          isActive: true,
        },
        create: {
          email: 'manager@example.com',
          passwordHash: 'hashed-password',
          role: Role.MANAGER,
          isActive: true,
        },
      });
      expect(prismaService.manager.upsert).toHaveBeenCalledWith({
        where: { accountId: mockAccount.id },
        update: {},
        create: { accountId: mockAccount.id },
      });
      expect(result).toEqual(mockAccount);
    });
  });

  describe('findAllCustomers', () => {
    it('returns customer accounts ordered by createdAt desc', async () => {
      const usersService = await createUsersServiceWithSharedMocks();
      const mockCustomers = [
        createMockAccount({ role: Role.CUSTOMER, email: 'a@example.com' }),
        createMockAccount({ role: Role.CUSTOMER, email: 'b@example.com' }),
      ];

      accountFindMany.mockResolvedValue(mockCustomers);

      const result = await usersService.findAllCustomers();

      expect(accountFindMany).toHaveBeenCalledWith({
        where: { role: Role.CUSTOMER },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockCustomers);
    });
  });

  describe('updateAccess', () => {
    it('activates customer account when isActive is true', async () => {
      const usersService = await createUsersServiceWithSharedMocks();
      const mockAccount = createMockAccount({
        role: Role.CUSTOMER,
        isActive: true,
      });

      accountFindUnique.mockResolvedValue(
        createMockAccount({ role: Role.CUSTOMER, isActive: false }),
      );
      accountUpdate.mockResolvedValue(mockAccount);

      const result = await usersService.updateAccess(MOCK_ACCOUNT_ID, {
        isActive: true,
      });

      expect(accountUpdate).toHaveBeenCalledWith({
        where: { id: MOCK_ACCOUNT_ID },
        data: { isActive: true },
        include: {
          customer: {
            include: {
              sellerProfile: true,
            },
          },
        },
      });
      expect(result).toEqual(mockAccount);
    });

    it('rejects updateAccess when user does not exist', async () => {
      const usersService = await createUsersServiceWithSharedMocks();

      accountFindUnique.mockResolvedValue(null);

      await expect(
        usersService.updateAccess(MOCK_ACCOUNT_ID, { isActive: true }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects updateAccess for manager accounts', async () => {
      const usersService = await createUsersServiceWithSharedMocks();

      accountFindUnique.mockResolvedValue(
        createMockAccount({ role: Role.MANAGER }),
      );

      await expect(
        usersService.updateAccess(MOCK_ACCOUNT_ID, { isActive: false }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('upsertSellerProfile', () => {
    const sellerInput = {
      name: 'Allegro sp. z o.o.',
      nip: '7740001454',
      address: '1 Test Street, Warsaw',
      bankAccountNumber: 'PL61109010140000071219812874',
    };

    it('creates seller profile for customer', async () => {
      const usersService = await createUsersServiceWithSharedMocks();
      const mockAccountWithCustomer = {
        ...createMockAccount({ role: Role.CUSTOMER }),
        customer: {
          id: 'customer-id',
          accountId: MOCK_ACCOUNT_ID,
          notificationChannel: NotificationChannel.EMAIL,
          phoneNumber: null,
          sellerProfile: null,
        },
      };
      const mockAccountWithSellerProfile = {
        ...mockAccountWithCustomer,
        customer: {
          ...mockAccountWithCustomer.customer,
          sellerProfile: {
            name: sellerInput.name,
            nip: sellerInput.nip,
            address: sellerInput.address,
            bankAccountNumber: sellerInput.bankAccountNumber,
          },
        },
      };

      accountFindUnique.mockResolvedValueOnce(mockAccountWithCustomer);
      sellerProfileFindUnique.mockResolvedValue(null);
      sellerProfileUpsert.mockResolvedValue({});
      accountFindUniqueOrThrow.mockResolvedValue(mockAccountWithSellerProfile);

      const result = await usersService.upsertSellerProfile(
        MOCK_ACCOUNT_ID,
        sellerInput,
      );

      expect(sellerProfileUpsert).toHaveBeenCalledWith({
        where: { customerId: 'customer-id' },
        create: {
          customerId: 'customer-id',
          name: sellerInput.name,
          nip: sellerInput.nip,
          address: sellerInput.address,
          bankAccountNumber: sellerInput.bankAccountNumber,
        },
        update: {
          name: sellerInput.name,
          nip: sellerInput.nip,
          address: sellerInput.address,
          bankAccountNumber: sellerInput.bankAccountNumber,
        },
      });
      expect(result).toEqual(mockAccountWithSellerProfile);
    });

    it('rejects duplicate NIP with ConflictException', async () => {
      const usersService = await createUsersServiceWithSharedMocks();

      accountFindUnique.mockResolvedValue({
        ...createMockAccount({ role: Role.CUSTOMER }),
        customer: {
          id: 'customer-id',
          accountId: MOCK_ACCOUNT_ID,
          notificationChannel: NotificationChannel.EMAIL,
          phoneNumber: null,
          sellerProfile: null,
        },
      });
      sellerProfileFindUnique.mockResolvedValue({
        id: 'other-seller-profile-id',
        customerId: 'other-customer-id',
        nip: sellerInput.nip,
        name: 'Other',
        address: 'Other address',
        bankAccountNumber: null,
      });

      await expect(
        usersService.upsertSellerProfile(MOCK_ACCOUNT_ID, sellerInput),
      ).rejects.toThrow(ConflictException);
    });
  });
});
