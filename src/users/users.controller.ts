import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserByEmailQueryDto } from './dto/user-by-email-query.dto';
import { UserResponseDto } from './dto/user-response.dto';
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
