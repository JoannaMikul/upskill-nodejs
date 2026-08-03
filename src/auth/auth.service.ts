import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Account } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PublicUser } from '../users/dto/public-user.dto';
import { mapToCreateAccountInput } from '../users/mappers/create-account.mapper';
import { toPublicUser } from '../users/mappers/user.mapper';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { mapRegisterDtoToCredentials } from './mappers/register.mapper';
import { JwtPayload } from '../common/types/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<PublicUser> {
    const credentials = mapRegisterDtoToCredentials(dto);

    const existingAccount = await this.prisma.account.findUnique({
      where: { email: credentials.email },
    });

    if (existingAccount) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(credentials.password, BCRYPT_ROUNDS);

    const createAccountInput = mapToCreateAccountInput(
      credentials.email,
      passwordHash,
    );

    const account = await this.prisma.$transaction((tx) =>
      tx.account.create({
        data: {
          ...createAccountInput,
          customer: {
            create: {},
          },
        },
      }),
    );

    return toPublicUser(account);
  }

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; user: PublicUser }> {
    const email = dto.email.toLowerCase();

    const account = await this.prisma.account.findUnique({
      where: { email },
    });

    if (!account) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      account.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = this.signToken(account);

    return {
      accessToken,
      user: toPublicUser(account),
    };
  }

  signToken(account: Pick<Account, 'id' | 'role'>): string {
    const payload: JwtPayload = {
      sub: account.id,
      role: account.role,
    };

    return this.jwtService.sign(payload);
  }
}
