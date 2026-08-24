import { Injectable, NotFoundException } from '@nestjs/common';
import { Account, Customer, Invoice } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type CustomerWithAccount = Customer & { account: Account };

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(accountId: string): Promise<Invoice> {
    const customer = await this.prisma.customer.findUnique({
      where: { accountId },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    return this.prisma.invoice.create({
      data: { customerId: customer.id },
    });
  }

  async findMyInvoices(accountId: string): Promise<Invoice[]> {
    const customer = await this.prisma.customer.findUnique({
      where: { accountId },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    return this.prisma.invoice.findMany({
      where: { customerId: customer.id },
    });
  }

  async findCustomersWithoutInvoiceForMonth(
    year: number,
    month: number,
  ): Promise<CustomerWithAccount[]> {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 1);

    return this.prisma.customer.findMany({
      where: {
        invoices: {
          none: {
            createdAt: {
              gte: monthStart, // >=
              lt: monthEnd, // <
            },
          },
        },
      },
      include: { account: true },
    });
  }
}
