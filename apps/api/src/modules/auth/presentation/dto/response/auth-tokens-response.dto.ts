import type { UserResponseDto } from './user-response.dto';

export interface AuthTokensResponseDto {
  accessToken: string;
  refreshToken: string;
  user: UserResponseDto;
}
