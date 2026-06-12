import type { RoleType } from '../../../../shared-kernal/domain/value-objects/role.vo';

export interface UserRolesQueryPort {
  getRoles(userId: string): Promise<RoleType[] | null>;
}
