import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { PublicUser } from '../users/dto/public-user.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<PublicUser> {
    return this.authService.register(dto);
  }

  @Post('login')
  // NestJS defaults POST responses to 201 — login does not create a resource, it returns a token (200).
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
  ): Promise<{ accessToken: string; user: PublicUser }> {
    return this.authService.login(dto);
  }
}
