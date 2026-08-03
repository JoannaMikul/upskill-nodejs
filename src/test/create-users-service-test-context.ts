import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

export type UsersServiceTestContext = {
  usersService: UsersService;
  prismaService: {
    account: {
      findUnique: jest.Mock;
    };
  };
};

export async function createUsersServiceTestContext(): Promise<UsersServiceTestContext> {
  const prismaService = {
    account: {
      findUnique: jest.fn(),
    },
  };

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
