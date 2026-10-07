import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { ActivityLogService } from './activity-log.service';
import { AuditController } from './audit.controller';

@Module({
  controllers: [AuditController],
  providers: [ActivityLogService, RolesGuard],
  exports: [ActivityLogService],
})
export class AuditModule {}
