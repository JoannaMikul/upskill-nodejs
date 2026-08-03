import { Injectable, NotFoundException } from '@nestjs/common';
import { UserResponseDto } from './dto/user-response.dto';
import { toUserResponseDto } from './mappers/user-response.mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserResponseDto> {
    const account = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('User not found');
    }

    return toUserResponseDto(account);
  }

  async findByEmail(email: string): Promise<UserResponseDto> {
    const account = await this.prisma.account.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!account) {
      throw new NotFoundException('User not found');
    }

    return toUserResponseDto(account);
  }
}
