import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Account } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { mapToCreateAccountInput } from '../users/mappers/create-account.mapper';
import { toUserResponseDto } from '../users/mappers/user-response.mapper';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthLoginResponseDto } from './dto/auth-login-response.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { mapRegisterCustomerDtoToInput } from './mappers/register-customer.mapper';
import { JwtPayload } from '../common/types/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterCustomerDto): Promise<UserResponseDto> {
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

    return toUserResponseDto(account);
  }

  async login(dto: AuthLoginDto): Promise<AuthLoginResponseDto> {
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
      user: toUserResponseDto(account),
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
