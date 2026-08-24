import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { toUserResponseDto } from '../users/mappers/user-response.mapper';
import { AuthLoginDto } from './dto/auth-login.dto';
import { AuthLoginResponseDto } from './dto/auth-login-response.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterCustomerDto): Promise<UserResponseDto> {
    const account = await this.authService.register(dto);
    return toUserResponseDto(account);
  }

  @Post('login')
  // NestJS defaults POST responses to 201 — login does not create a resource, it returns a token (200).
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: AuthLoginDto): Promise<AuthLoginResponseDto> {
    const { accessToken, account } = await this.authService.login(dto);
    return {
      accessToken,
      user: toUserResponseDto(account),
    };
  }
}
