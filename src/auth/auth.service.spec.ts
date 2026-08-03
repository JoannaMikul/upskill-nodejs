import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createAuthServiceTestContext } from '../test/create-auth-service-test-context';
import { createMockAccount } from '../test/create-mock-account';

jest.mock('bcrypt');

describe('AuthService', () => {
  describe('register', () => {
    it('hashes password and creates account with CUSTOMER role and customer profile', async () => {
      const { authService, prismaService } =
        await createAuthServiceTestContext();
      const mockAccount = createMockAccount();

      prismaService.account.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prismaService.account.create.mockResolvedValue(mockAccount);

      const result = await authService.register({
        email: 'Test@Example.com',
        password: 'password123',
      });

      expect(prismaService.account.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(prismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(prismaService.account.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          passwordHash: 'hashed-password',
          role: Role.CUSTOMER,
          customer: {
            create: {},
          },
        },
      });
      expect(result).toEqual(mockAccount);
    });

    it('rejects duplicate email with ConflictException and does not create user', async () => {
      const { authService, prismaService } =
        await createAuthServiceTestContext();
      const mockAccount = createMockAccount();

      prismaService.account.findUnique.mockResolvedValue(mockAccount);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);

      expect(prismaService.$transaction).not.toHaveBeenCalled();
      expect(prismaService.account.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns access token and account on valid credentials', async () => {
      const { authService, prismaService, jwtService } =
        await createAuthServiceTestContext();
      const mockAccount = createMockAccount();

      prismaService.account.findUnique.mockResolvedValue(mockAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockAccount.id,
        role: mockAccount.role,
      });
      expect(result).toEqual({
        accessToken: 'mock-jwt-token',
        account: mockAccount,
      });
    });

    it('rejects login when password does not match and does not sign access token', async () => {
      const { authService, prismaService, jwtService } =
        await createAuthServiceTestContext();
      const mockAccount = createMockAccount();

      prismaService.account.findUnique.mockResolvedValue(mockAccount);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('rejects login when user does not exist with UnauthorizedException', async () => {
      const { authService, prismaService } =
        await createAuthServiceTestContext();

      prismaService.account.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'unknown@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
