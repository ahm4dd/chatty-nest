import { RoleType } from '../../../../shared-kernal/domain/value-objects/role.vo';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  roles: RoleType[];
  sessionId: string;
}
