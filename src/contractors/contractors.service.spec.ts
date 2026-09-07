import { ConflictException, NotFoundException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { Contractor } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ContractorsService } from './contractors.service';

const contractorId = '550e8400-e29b-41d4-a716-446655440010';
const otherContractorId = '550e8400-e29b-41d4-a716-446655440011';

const mockContractor: Contractor = {
  id: contractorId,
  name: 'Nike',
  nip: '1234567891',
  address: '1 Test Street',
  postalCode: '00-001',
  city: 'Warsaw',
  country: 'PL',
  email: 'billing@nike.example',
  phone: '+48123456789',
  bankAccountNumber: 'PL61109010140000071219812874',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const createInput = {
  name: mockContractor.name,
  nip: mockContractor.nip,
  address: mockContractor.address,
  postalCode: mockContractor.postalCode,
  city: mockContractor.city,
  country: mockContractor.country,
  email: mockContractor.email ?? undefined,
  phone: mockContractor.phone ?? undefined,
  bankAccountNumber: mockContractor.bankAccountNumber ?? undefined,
};

describe('ContractorsService', () => {
  const findUnique = jest.fn();
  const findMany = jest.fn();
  const create = jest.fn();
  const update = jest.fn();
  let contractorsService: ContractorsService;

  beforeEach(async () => {
    findUnique.mockReset();
    findMany.mockReset();
    create.mockReset();
    update.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractorsService,
        {
          provide: PrismaService,
          useValue: {
            contractor: { findUnique, findMany, create, update },
          },
        },
      ],
    }).compile();

    contractorsService = module.get(ContractorsService);
  });

  describe('create', () => {
    it('creates contractor when NIP is available', async () => {
      findUnique.mockResolvedValue(null);
      create.mockResolvedValue(mockContractor);

      const result = await contractorsService.create(createInput);

      expect(findUnique).toHaveBeenCalledWith({
        where: { nip: createInput.nip },
      });
      expect(create).toHaveBeenCalledWith({ data: createInput });
      expect(result).toEqual(mockContractor);
    });

    it('throws ConflictException when NIP already exists', async () => {
      findUnique.mockResolvedValue(mockContractor);

      await expect(contractorsService.create(createInput)).rejects.toThrow(
        ConflictException,
      );

      expect(create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns contractors ordered by name', async () => {
      findMany.mockResolvedValue([mockContractor]);

      const result = await contractorsService.findAll();

      expect(findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual([mockContractor]);
    });
  });

  describe('findById', () => {
    it('returns contractor when found', async () => {
      findUnique.mockResolvedValue(mockContractor);

      const result = await contractorsService.findById(contractorId);

      expect(findUnique).toHaveBeenCalledWith({
        where: { id: contractorId },
      });
      expect(result).toEqual(mockContractor);
    });

    it('throws NotFoundException when contractor does not exist', async () => {
      findUnique.mockResolvedValue(null);

      await expect(
        contractorsService.findById('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates contractor when it exists and NIP stays unique', async () => {
      const updatedContractor = {
        ...mockContractor,
        name: 'Nike Poland',
      };

      findUnique
        .mockResolvedValueOnce(mockContractor)
        .mockResolvedValueOnce(null);
      update.mockResolvedValue(updatedContractor);

      const result = await contractorsService.update(contractorId, {
        name: 'Nike Poland',
        nip: '7740001454',
      });

      expect(update).toHaveBeenCalledWith({
        where: { id: contractorId },
        data: { name: 'Nike Poland', nip: '7740001454' },
      });
      expect(result).toEqual(updatedContractor);
    });

    it('throws NotFoundException when contractor does not exist', async () => {
      findUnique.mockResolvedValue(null);

      await expect(
        contractorsService.update('00000000-0000-0000-0000-000000000000', {
          name: 'Missing',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(update).not.toHaveBeenCalled();
    });

    it('throws ConflictException when updated NIP belongs to another contractor', async () => {
      findUnique.mockResolvedValueOnce(mockContractor).mockResolvedValueOnce({
        ...mockContractor,
        id: otherContractorId,
        nip: '7740001454',
      });

      await expect(
        contractorsService.update(contractorId, { nip: '7740001454' }),
      ).rejects.toThrow(ConflictException);

      expect(update).not.toHaveBeenCalled();
    });
  });
});
