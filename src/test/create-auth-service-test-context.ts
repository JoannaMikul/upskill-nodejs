import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';

export type AuthServiceTestContext = {
  authService: AuthService;
  prismaService: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
  jwtService: { sign: jest.Mock };
};

export async function createAuthServiceTestContext(): Promise<AuthServiceTestContext> {
  const prismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

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
