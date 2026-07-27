import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { createMockUser } from '../test/create-mock-user';
import { createUsersServiceTestContext } from '../test/create-users-service-test-context';

describe('UsersService', () => {
  describe('findById', () => {
    it('returns public user when found', async () => {
      const { usersService, prismaService } =
        await createUsersServiceTestContext();
      const mockUser = createMockUser({ role: Role.MANAGER });

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await usersService.findById('user-uuid');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-uuid' },
      });
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('rejects findById when user does not exist with NotFoundException', async () => {
      const { usersService, prismaService } =
        await createUsersServiceTestContext();

      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(usersService.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('returns public user on exact match with lowercase normalization', async () => {
      const { usersService, prismaService } =
        await createUsersServiceTestContext();
      const mockUser = createMockUser({ role: Role.MANAGER });

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await usersService.findByEmail('Test@Example.com');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result.email).toBe('test@example.com');
    });

    it('rejects findByEmail when no user matches the address with NotFoundException', async () => {
      const { usersService, prismaService } =
        await createUsersServiceTestContext();

      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        usersService.findByEmail('unknown@example.com'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
