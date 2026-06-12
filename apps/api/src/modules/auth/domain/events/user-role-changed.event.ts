import { DomainEvent } from '../../../../shared-kernal/domain/events/domain.event';
import { RoleType } from '../../../../shared-kernal/domain/value-objects/role.vo';

export class UserRoleChangedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly previousRoles: RoleType[],
    public readonly newRoles: RoleType[],
  ) {
    super();
  }
}
