import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../common/guards/roles.guard';
import { ActivityLogService } from './activity-log.service';
import { AuditController } from './audit.controller';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [AuditController],
  providers: [ActivityLogService, RolesGuard],
  exports: [ActivityLogService],
})
export class AuditModule {}
