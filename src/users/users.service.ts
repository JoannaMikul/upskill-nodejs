import { Injectable, NotFoundException } from '@nestjs/common';
import { Account, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Account> {
    const account = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('User not found');
    }

    return account;
  }

  async findByEmail(email: string): Promise<Account> {
    const account = await this.prisma.account.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!account) {
      throw new NotFoundException('User not found');
    }

    return account;
  }

  async seedManager(email: string, password: string): Promise<Account> {
    const normalizedEmail = email.toLowerCase();
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.upsert({
        where: { email: normalizedEmail },
        update: {
          passwordHash,
          role: Role.MANAGER,
        },
        create: {
          email: normalizedEmail,
          passwordHash,
          role: Role.MANAGER,
        },
      });

      await tx.manager.upsert({
        where: { accountId: account.id },
        update: {},
        create: { accountId: account.id },
      });

      return account;
    });
  }
}
