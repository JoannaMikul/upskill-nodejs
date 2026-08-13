import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  createMockAccount,
  MOCK_ACCOUNT_ID,
} from '../test/create-mock-account';
import { createUsersServiceTestContext } from '../test/create-users-service-test-context';

jest.mock('bcrypt');

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
        include: { customer: true },
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
        },
        create: {
          email: 'manager@example.com',
          passwordHash: 'hashed-password',
          role: Role.MANAGER,
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
});
