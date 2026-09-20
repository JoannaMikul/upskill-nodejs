import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ActivityLogService } from './activity-log.service';
import { ActivityLogListQueryDto } from './dto/activity-log-list-query.dto';
import type { ActivityLogResponseDto } from './dto/activity-log-response.dto';
import { toActivityLogResponseDto } from './mappers/activity-log-response.mapper';

@Controller('audit')
export class AuditController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get('activity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER)
  async findActivity(
    @Query() query: ActivityLogListQueryDto,
  ): Promise<ActivityLogResponseDto[]> {
    const entries = await this.activityLogService.findActivityLogs(query);
    return entries.map(toActivityLogResponseDto);
  }
}
