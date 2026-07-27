import { Injectable, NotFoundException } from '@nestjs/common';
import { PublicUser } from './dto/public-user.dto';
import { toPublicUser } from './mappers/user.mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return toPublicUser(user);
  }

  async findByEmail(email: string): Promise<PublicUser> {
    const formattedEmail = email.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: formattedEmail },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return toPublicUser(user);
  }
}
