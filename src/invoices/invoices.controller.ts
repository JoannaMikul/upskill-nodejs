import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedUser } from '../common/types/authenticated-user.interface';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
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
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoicesService.create(user.sub);
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
}
