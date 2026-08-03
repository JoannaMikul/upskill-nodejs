import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

export type AuthServiceTestContext = {
  authService: AuthService;
  prismaService: {
    account: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  jwtService: { sign: jest.Mock };
};

export async function createAuthServiceTestContext(): Promise<AuthServiceTestContext> {
  const prismaService = {
    account: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  prismaService.$transaction.mockImplementation(
    (callback: (tx: typeof prismaService) => unknown) =>
      callback(prismaService),
  );

  const jwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      AuthService,
      { provide: PrismaService, useValue: prismaService },
      { provide: JwtService, useValue: jwtService },
    ],
  }).compile();

  return {
    authService: module.get<AuthService>(AuthService),
    prismaService,
    jwtService,
  };
}
