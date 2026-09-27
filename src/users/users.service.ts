import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Account } from '@prisma/client';
import { NotificationChannel, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateAccessInput } from './model/update-access.input';
import type { UpdateNotificationPreferencesInput } from './model/update-notification-preferences.input';
import type { UpsertSellerProfileInput } from './model/upsert-seller-profile.input';

const BCRYPT_ROUNDS = 12;

const accountWithCustomerInclude = {
  customer: {
    include: {
      sellerProfile: true,
    },
  },
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Account> {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: accountWithCustomerInclude,
    });

    if (!account) {
      throw new NotFoundException('User not found');
    }

    return account;
  }

  async findAllCustomers(): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: { role: Role.CUSTOMER },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateAccess(
    accountId: string,
    input: UpdateAccessInput,
  ): Promise<Account> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('User not found');
    }

    if (account.role !== Role.CUSTOMER) {
      throw new BadRequestException(
        'Access can only be changed for customer accounts',
      );
    }

    return this.prisma.account.update({
      where: { id: accountId },
      data: { isActive: input.isActive },
      include: accountWithCustomerInclude,
    });
  }

  async upsertSellerProfile(
    accountId: string,
    input: UpsertSellerProfileInput,
  ): Promise<Account> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { customer: { include: { sellerProfile: true } } },
    });

    if (!account) {
      throw new NotFoundException('User not found');
    }

    if (!account.customer) {
      throw new NotFoundException('Customer profile not found');
    }

    await this.assertSellerNipAvailable(
      input.nip,
      account.customer.sellerProfile?.id,
    );

    await this.prisma.sellerProfile.upsert({
      where: { customerId: account.customer.id },
      create: {
        customerId: account.customer.id,
        name: input.name,
        nip: input.nip,
        address: input.address,
        bankAccountNumber: input.bankAccountNumber ?? null,
      },
      update: {
        name: input.name,
        nip: input.nip,
        address: input.address,
        bankAccountNumber: input.bankAccountNumber ?? null,
      },
    });

    return this.prisma.account.findUniqueOrThrow({
      where: { id: accountId },
      include: accountWithCustomerInclude,
    });
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
      include: accountWithCustomerInclude,
    });
  }

  async findByEmail(email: string): Promise<Account> {
    const account = await this.prisma.account.findUnique({
      where: { email: email.toLowerCase() },
      include: accountWithCustomerInclude,
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
          isActive: true,
        },
        create: {
          email: normalizedEmail,
          passwordHash,
          role: Role.MANAGER,
          isActive: true,
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

  private async assertSellerNipAvailable(
    nip: string,
    excludeSellerProfileId?: string,
  ): Promise<void> {
    const existing = await this.prisma.sellerProfile.findUnique({
      where: { nip },
    });

    if (existing && existing.id !== excludeSellerProfileId) {
      throw new ConflictException('NIP already registered');
    }
  }
}
