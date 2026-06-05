import type { UserResponseDto } from './user-response.dto';
import type { SessionInfoDto } from './session-info.dto';

export interface CurrentSessionResponseDto {
  user: UserResponseDto;
  session: SessionInfoDto;
}
