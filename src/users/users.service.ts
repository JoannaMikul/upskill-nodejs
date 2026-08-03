import { Injectable, NotFoundException } from '@nestjs/common';
import { PublicUser } from './dto/public-user.dto';
import { toPublicUser } from './mappers/user.mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PublicUser> {
    const account = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('User not found');
    }

    return toPublicUser(account);
  }

  async findByEmail(email: string): Promise<PublicUser> {
    const formattedEmail = email.toLowerCase();

    const account = await this.prisma.account.findUnique({
      where: { email: formattedEmail },
    });

    if (!account) {
      throw new NotFoundException('User not found');
    }

    return toPublicUser(account);
  }
}
