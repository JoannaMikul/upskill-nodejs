import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ActivityAction, type Account } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ActivityLogService } from '../audit/activity-log.service';
import type { JwtPayload } from '../common/types/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { mapToCreateAccountInput } from '../users/mappers/create-account.mapper';
import { AuthLoginDto } from './dto/auth-login.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { mapRegisterCustomerDtoToInput } from './mappers/register-customer.mapper';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly activityLogService: ActivityLogService,
  ) {}

  async register(dto: RegisterCustomerDto): Promise<Account> {
    const credentials = mapRegisterCustomerDtoToInput(dto);

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

    return this.prisma.$transaction((tx) =>
      tx.account.create({
        data: {
          ...createAccountInput,
          isActive: false,
          customer: {
            create: {},
          },
        },
      }),
    );
  }

  async login(
    dto: AuthLoginDto,
  ): Promise<{ accessToken: string; account: Account }> {
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

    if (!account.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = this.signToken(account);

    await this.activityLogService.log(account.id, ActivityAction.LOGIN);

    return { accessToken, account };
  }

  signToken(account: Pick<Account, 'id' | 'role'>): string {
    const payload: JwtPayload = {
      sub: account.id,
      role: account.role,
    };

    return this.jwtService.sign(payload);
  }
}
