import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ZodValidationPipe } from 'nestjs-zod';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  UpdateNotificationPreferencesSchema,
  type UpdateNotificationPreferences,
} from './dto/update-notification-preferences.dto';
import { UserByEmailQueryDto } from './dto/user-by-email-query.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { mapUpdateNotificationPreferencesDtoToInput } from './mappers/update-notification-preferences.mapper';
import { toUserResponseDto } from './mappers/user-response.mapper';
import type { AuthenticatedUser } from '../common/types/authenticated-user.interface';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    const account = await this.usersService.findById(user.sub);
    return toUserResponseDto(account);
  }

  @Patch('me/notification-preferences')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  async updateNotificationPreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(UpdateNotificationPreferencesSchema))
    dto: UpdateNotificationPreferences,
  ): Promise<UserResponseDto> {
    const account = await this.usersService.updateNotificationPreferences(
      user.sub,
      mapUpdateNotificationPreferencesDtoToInput(dto),
    );
    return toUserResponseDto(account);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER)
  async findByEmail(
    @Query() query: UserByEmailQueryDto,
  ): Promise<UserResponseDto> {
    const account = await this.usersService.findByEmail(query.email);
    return toUserResponseDto(account);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER)
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    const account = await this.usersService.findById(id);
    return toUserResponseDto(account);
  }
}
