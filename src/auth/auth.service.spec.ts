import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createAuthServiceTestContext } from '../test/create-auth-service-test-context';
import { createMockUser } from '../test/create-mock-user';

jest.mock('bcrypt');

describe('AuthService', () => {
  describe('register', () => {
    it('hashes password and creates user with SUBCONTRACTOR role', async () => {
      const { authService, prismaService } =
        await createAuthServiceTestContext();
      const mockUser = createMockUser();

      prismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prismaService.user.create.mockResolvedValue(mockUser);

      const result = await authService.register({
        email: 'Test@Example.com',
        password: 'password123',
      });

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          passwordHash: 'hashed-password',
          role: Role.SUBCONTRACTOR,
        },
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

    it('rejects duplicate email with ConflictException and does not create user', async () => {
      const { authService, prismaService } =
        await createAuthServiceTestContext();
      const mockUser = createMockUser();

      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);

      expect(prismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns access token and public user on valid credentials', async () => {
      const { authService, prismaService, jwtService } =
        await createAuthServiceTestContext();
      const mockUser = createMockUser();

      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        role: mockUser.role,
      });
      expect(result).toEqual({
        accessToken: 'mock-jwt-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
      });
    });

    it('rejects login when password does not match and does not sign access token', async () => {
      const { authService, prismaService, jwtService } =
        await createAuthServiceTestContext();
      const mockUser = createMockUser();

      prismaService.user.findUnique.mockResolvedValue(mockUser);
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

      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'unknown@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
