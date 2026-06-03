import { Controller, Post, Request } from '@nestjs/common';
import { AuthService } from '../../application/services/auth.service';
import { UwsRequest } from 'uwestjs';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  login(@Request() req: UwsRequest) {}
}
