import { Injectable, NotFoundException } from '@nestjs/common';
import type { Account } from '@prisma/client';
import { NotificationChannel, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UpdateNotificationPreferencesInput } from './model/update-notification-preferences.input';
import { PrismaService } from '../prisma/prisma.service';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Account> {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: { customer: true },
    });

    if (!account) {
      throw new NotFoundException('User not found');
    }

    return account;
  }

  async updateNotificationPreferences(
    accountId: string,
    input: UpdateNotificationPreferencesInput,
  ): Promise<Account> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { customer: true },
    });

    if (!account) {
      throw new NotFoundException('User not found');
    }

    if (!account.customer) {
      throw new NotFoundException('Customer profile not found');
    }

    await this.prisma.customer.update({
      where: { accountId },
      data:
        input.notificationChannel === NotificationChannel.SMS
          ? {
              notificationChannel: NotificationChannel.SMS,
              phoneNumber: input.phoneNumber,
            }
          : {
              notificationChannel: NotificationChannel.EMAIL,
              phoneNumber: null,
            },
    });

    return this.prisma.account.findUniqueOrThrow({
      where: { id: accountId },
      include: { customer: true },
    });
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
