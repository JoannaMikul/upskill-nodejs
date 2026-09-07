import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ContractorsService } from './contractors.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import type { ContractorResponseDto } from './dto/contractor-response.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';
import { mapCreateContractorDtoToInput } from './mappers/create-contractor.mapper';
import { toContractorResponseDto } from './mappers/contractor-response.mapper';
import { mapUpdateContractorDtoToInput } from './mappers/update-contractor.mapper';

@Controller('contractors')
export class ContractorsController {
  constructor(private readonly contractorsService: ContractorsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER)
  async create(
    @Body() dto: CreateContractorDto,
  ): Promise<ContractorResponseDto> {
    const contractor = await this.contractorsService.create(
      mapCreateContractorDtoToInput(dto),
    );
    return toContractorResponseDto(contractor);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER)
  async findAll(): Promise<ContractorResponseDto[]> {
    const contractors = await this.contractorsService.findAll();
    return contractors.map(toContractorResponseDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER)
  async findById(@Param('id') id: string): Promise<ContractorResponseDto> {
    const contractor = await this.contractorsService.findById(id);
    return toContractorResponseDto(contractor);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContractorDto,
  ): Promise<ContractorResponseDto> {
    const contractor = await this.contractorsService.update(
      id,
      mapUpdateContractorDtoToInput(dto),
    );
    return toContractorResponseDto(contractor);
  }
}
