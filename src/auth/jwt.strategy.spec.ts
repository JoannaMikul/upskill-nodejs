import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy';
import { createMockAccount } from '../test/create-mock-account';

describe('JwtStrategy', () => {
  const configService = {
    getOrThrow: jest.fn().mockReturnValue('test-jwt-secret'),
  } as unknown as ConfigService;

  const prismaService = {
    account: {
      findUnique: jest.fn(),
    },
  };

  const strategy = new JwtStrategy(configService, prismaService as never);

  it('returns authenticated user when account is active', async () => {
    const mockAccount = createMockAccount({ role: Role.CUSTOMER });

    prismaService.account.findUnique.mockResolvedValue(mockAccount);

    const result = await strategy.validate({
      sub: mockAccount.id,
      role: mockAccount.role,
    });

    expect(result).toEqual({
      sub: mockAccount.id,
      role: mockAccount.role,
    });
  });

  it('rejects inactive account with UnauthorizedException', async () => {
    const mockAccount = createMockAccount({ isActive: false });

    prismaService.account.findUnique.mockResolvedValue(mockAccount);

    await expect(
      strategy.validate({
        sub: mockAccount.id,
        role: mockAccount.role,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects missing account with UnauthorizedException', async () => {
    prismaService.account.findUnique.mockResolvedValue(null);

    await expect(
      strategy.validate({
        sub: '00000000-0000-0000-0000-000000000000',
        role: Role.CUSTOMER,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
