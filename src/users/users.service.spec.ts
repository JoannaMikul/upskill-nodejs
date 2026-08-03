import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  createMockAccount,
  MOCK_ACCOUNT_ID,
} from '../test/create-mock-account';
import { createUsersServiceTestContext } from '../test/create-users-service-test-context';

describe('UsersService', () => {
  describe('findById', () => {
    it('returns public user when found', async () => {
      const { usersService, prismaService } =
        await createUsersServiceTestContext();
      const mockAccount = createMockAccount({ role: Role.MANAGER });

      prismaService.account.findUnique.mockResolvedValue(mockAccount);

      const result = await usersService.findById(MOCK_ACCOUNT_ID);

      expect(prismaService.account.findUnique).toHaveBeenCalledWith({
        where: { id: MOCK_ACCOUNT_ID },
      });
      expect(result).toEqual({
        id: mockAccount.id,
        email: mockAccount.email,
        role: mockAccount.role,
        createdAt: mockAccount.createdAt,
        updatedAt: mockAccount.updatedAt,
      });
      expect(result).not.toHaveProperty('passwordHash');
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
    it('returns public user on exact match with lowercase normalization', async () => {
      const { usersService, prismaService } =
        await createUsersServiceTestContext();
      const mockAccount = createMockAccount({ role: Role.MANAGER });

      prismaService.account.findUnique.mockResolvedValue(mockAccount);

      const result = await usersService.findByEmail('Test@Example.com');

      expect(prismaService.account.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result.email).toBe('test@example.com');
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
});
