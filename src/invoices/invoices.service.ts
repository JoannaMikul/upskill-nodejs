import { Injectable, NotFoundException } from '@nestjs/common';
import type { Account, Customer, Invoice } from '@prisma/client';
import { Prisma } from '@prisma/client';
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

    const today = new Date();

    return this.prisma.invoice.create({
      data: {
        customerId: customer.id,
        invoiceNumber: `INVOICE-NUMBER-${crypto.randomUUID()}`,
        issueDate: today,
        saleDate: today,
        netAmount: new Prisma.Decimal(0),
        vatAmount: new Prisma.Decimal(0),
        grossAmount: new Prisma.Decimal(0),
      },
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
        account: {
          isActive: true,
        },
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
