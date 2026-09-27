import { JwtService } from '@nestjs/jwt';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ActivityLogService } from '../audit/activity-log.service';
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
  logActivityMock: jest.MockedFunction<ActivityLogService['log']>;
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

  const logActivityMock = jest.fn() as jest.MockedFunction<
    ActivityLogService['log']
  >;

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      AuthService,
      { provide: PrismaService, useValue: prismaService },
      { provide: JwtService, useValue: jwtService },
      {
        provide: ActivityLogService,
        useValue: { log: logActivityMock },
      },
    ],
  }).compile();

  return {
    authService: module.get<AuthService>(AuthService),
    prismaService,
    jwtService,
    logActivityMock,
  };
}
