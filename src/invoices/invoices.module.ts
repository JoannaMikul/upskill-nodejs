import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [InvoicesController],
  providers: [InvoicesService, RolesGuard],
  exports: [InvoicesService],
})
export class InvoicesModule {}
