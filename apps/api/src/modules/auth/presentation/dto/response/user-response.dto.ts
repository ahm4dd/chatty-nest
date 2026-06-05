import type { RoleType } from '../../../../../shared-kernal/domain/value-objects/role.vo';

export interface UserResponseDto {
  id: string;
  email: string;
  role: RoleType;
}
