import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PublicUser } from '../users/dto/public-user.dto';
import { mapToCreateUserInput } from '../users/mappers/create-user.mapper';
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

    const existingUser = await this.prisma.user.findUnique({
      where: { email: credentials.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(credentials.password, BCRYPT_ROUNDS);

    const createUserInput = mapToCreateUserInput(
      credentials.email,
      passwordHash,
    );

    const user = await this.prisma.user.create({
      data: createUserInput,
    });

    return toPublicUser(user);
  }

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; user: PublicUser }> {
    const email = dto.email.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = this.signToken(user);

    return {
      accessToken,
      user: toPublicUser(user),
    };
  }

  signToken(user: Pick<User, 'id' | 'role'>): string {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }
}
