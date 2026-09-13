import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, type Account, type Customer } from '@prisma/client';
import { Prisma } from '@prisma/client';
import {
  calculateInvoiceTotals,
  calculateLineAmounts,
} from '../common/validation/invoice-amounts';
import { PrismaService } from '../prisma/prisma.service';
import {
  assertInvoiceWithDetails,
  invoiceDetailsInclude,
  type InvoiceWithDetails,
} from './model/invoice-with-details';
import type { CreateInvoiceInput } from './model/create-invoice.input';

type CustomerWithAccount = Customer & { account: Account };

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    accountId: string,
    input: CreateInvoiceInput,
  ): Promise<InvoiceWithDetails> {
    const customer = await this.prisma.customer.findUnique({
      where: { accountId },
      include: { sellerProfile: true },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    if (!customer.sellerProfile) {
      throw new NotFoundException('Seller profile not found');
    }

    const contractor = await this.prisma.contractor.findUnique({
      where: { id: input.buyerId },
    });

    if (!contractor) {
      throw new NotFoundException('Contractor not found');
    }

    const existingInvoice = await this.prisma.invoice.findUnique({
      where: {
        customerId_invoiceNumber: {
          customerId: customer.id,
          invoiceNumber: input.invoiceNumber,
        },
      },
    });

    if (existingInvoice) {
      throw new ConflictException('Invoice number already exists');
    }

    const sellerProfile = customer.sellerProfile;

    const calculatedLineItems = input.lineItems.map((lineItem) => {
      const amounts = calculateLineAmounts({
        quantity: lineItem.quantity,
        unitNetPrice: lineItem.unitNetPrice,
        vatRate: lineItem.vatRate,
      });

      return {
        lineNumber: lineItem.lineNumber,
        name: lineItem.name,
        unitOfMeasure: lineItem.unitOfMeasure,
        quantity: new Prisma.Decimal(lineItem.quantity),
        unitNetPrice: new Prisma.Decimal(lineItem.unitNetPrice),
        vatRate: lineItem.vatRate,
        netAmount: amounts.netAmount,
        vatAmount: amounts.vatAmount,
        grossAmount: amounts.grossAmount,
      };
    });

    const totals = calculateInvoiceTotals(
      calculatedLineItems.map(({ netAmount, vatAmount, grossAmount }) => ({
        netAmount,
        vatAmount,
        grossAmount,
      })),
    );

    const invoice = await this.prisma.$transaction((tx) =>
      tx.invoice.create({
        include: invoiceDetailsInclude,
        data: {
          customerId: customer.id,
          invoiceNumber: input.invoiceNumber,
          issueDate: input.issueDate,
          saleDate: input.saleDate,
          netAmount: totals.netAmount,
          vatAmount: totals.vatAmount,
          grossAmount: totals.grossAmount,
          seller: {
            create: {
              name: sellerProfile.name,
              nip: sellerProfile.nip,
              address: sellerProfile.address,
              bankAccountNumber: sellerProfile.bankAccountNumber,
            },
          },
          buyer: {
            create: {
              contractorId: contractor.id,
              name: contractor.name,
              nip: contractor.nip,
              address: contractor.address,
              postalCode: contractor.postalCode,
              city: contractor.city,
              country: contractor.country,
            },
          },
          lineItems: {
            create: calculatedLineItems,
          },
        },
      }),
    );

    return assertInvoiceWithDetails(invoice);
  }

  async findMyInvoices(accountId: string): Promise<InvoiceWithDetails[]> {
    const customer = await this.prisma.customer.findUnique({
      where: { accountId },
    });

    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }

    const invoices = await this.prisma.invoice.findMany({
      where: { customerId: customer.id },
      include: invoiceDetailsInclude,
      orderBy: { createdAt: 'desc' },
    });

    return invoices.map(assertInvoiceWithDetails);
  }

  async findById(
    accountId: string,
    role: Role,
    invoiceId: string,
  ): Promise<InvoiceWithDetails> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: invoiceDetailsInclude,
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (role === Role.CUSTOMER) {
      const customer = await this.prisma.customer.findUnique({
        where: { accountId },
      });

      if (!customer || invoice.customerId !== customer.id) {
        throw new NotFoundException('Invoice not found');
      }
    }

    return assertInvoiceWithDetails(invoice);
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
