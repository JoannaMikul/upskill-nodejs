import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { ContractorsController } from './contractors.controller';
import { ContractorsService } from './contractors.service';

@Module({
  imports: [AuthModule],
  controllers: [ContractorsController],
  providers: [ContractorsService, RolesGuard],
  exports: [ContractorsService],
})
export class ContractorsModule {}
