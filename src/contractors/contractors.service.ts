import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Contractor } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateContractorInput } from './model/create-contractor.input';
import type { UpdateContractorInput } from './model/update-contractor.input';

@Injectable()
export class ContractorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateContractorInput): Promise<Contractor> {
    await this.assertNipAvailable(input.nip);

    return this.prisma.contractor.create({
      data: input,
    });
  }

  async findAll(): Promise<Contractor[]> {
    return this.prisma.contractor.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<Contractor> {
    const contractor = await this.prisma.contractor.findUnique({
      where: { id },
    });

    if (!contractor) {
      throw new NotFoundException('Contractor not found');
    }

    return contractor;
  }

  async update(id: string, input: UpdateContractorInput): Promise<Contractor> {
    await this.findById(id);

    if (input.nip !== undefined) {
      await this.assertNipAvailable(input.nip, id);
    }

    return this.prisma.contractor.update({
      where: { id },
      data: input,
    });
  }

  private async assertNipAvailable(
    nip: string,
    excludeContractorId?: string,
  ): Promise<void> {
    const existing = await this.prisma.contractor.findUnique({
      where: { nip },
    });

    if (existing && existing.id !== excludeContractorId) {
      throw new ConflictException('NIP already registered');
    }
  }
}
