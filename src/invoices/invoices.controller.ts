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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedUser } from '../common/types/authenticated-user.interface';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { mapCreateInvoiceDtoToInput } from './mappers/create-invoice.mapper';
import { mapUpdateInvoiceDtoToInput } from './mappers/update-invoice.mapper';
import { toInvoiceResponseDto } from './mappers/invoice-response.mapper';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoicesService.create(
      user.sub,
      mapCreateInvoiceDtoToInput(dto),
    );
    return toInvoiceResponseDto(invoice);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  async findMyInvoices(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<InvoiceResponseDto[]> {
    const invoices = await this.invoicesService.findMyInvoices(user.sub);
    return invoices.map(toInvoiceResponseDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoicesService.update(
      user.sub,
      id,
      mapUpdateInvoiceDtoToInput(dto),
    );
    return toInvoiceResponseDto(invoice);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER, Role.MANAGER)
  async findById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoicesService.findById(
      user.sub,
      user.role,
      id,
    );
    return toInvoiceResponseDto(invoice);
  }
}
