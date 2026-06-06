import { RoleType } from '../../../../shared-kernal/domain/value-objects/role.vo';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: RoleType[];
  sessionId: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  roles: RoleType[];
  sessionId: string;
}
