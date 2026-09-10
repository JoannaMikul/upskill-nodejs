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
import type { CustomerListItemResponseDto } from './dto/customer-list-item-response.dto';
import { UpdateAccessDto } from './dto/update-access.dto';
import {
  UpdateNotificationPreferencesSchema,
  type UpdateNotificationPreferences,
} from './dto/update-notification-preferences.dto';
import { UpsertSellerProfileDto } from './dto/upsert-seller-profile.dto';
import { UserByEmailQueryDto } from './dto/user-by-email-query.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { toCustomerListItemResponseDto } from './mappers/customer-list-item.mapper';
import { mapUpdateAccessDtoToInput } from './mappers/update-access.mapper';
import { mapUpdateNotificationPreferencesDtoToInput } from './mappers/update-notification-preferences.mapper';
import { mapUpsertSellerProfileDtoToInput } from './mappers/upsert-seller-profile.mapper';
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

  @Patch('me/seller-profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CUSTOMER)
  async upsertSellerProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertSellerProfileDto,
  ): Promise<UserResponseDto> {
    const account = await this.usersService.upsertSellerProfile(
      user.sub,
      mapUpsertSellerProfileDtoToInput(dto),
    );
    return toUserResponseDto(account);
  }

  @Get('customers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER)
  async findAllCustomers(): Promise<CustomerListItemResponseDto[]> {
    const accounts = await this.usersService.findAllCustomers();
    return accounts.map(toCustomerListItemResponseDto);
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

  @Patch(':id/access')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MANAGER)
  async updateAccess(
    @Param('id') id: string,
    @Body() dto: UpdateAccessDto,
  ): Promise<UserResponseDto> {
    const account = await this.usersService.updateAccess(
      id,
      mapUpdateAccessDtoToInput(dto),
    );
    return toUserResponseDto(account);
  }
}
