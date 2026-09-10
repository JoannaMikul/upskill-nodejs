import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

export async function createUsersServiceTestContext() {
  const prismaService = {
    account: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    manager: {
      upsert: jest.fn(),
    },
    customer: {
      update: jest.fn(),
    },
    sellerProfile: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
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

  return {
    usersService: module.get<UsersService>(UsersService),
    prismaService,
  };
}

export type UsersServiceTestContext = Awaited<
  ReturnType<typeof createUsersServiceTestContext>
>;
