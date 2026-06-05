import { DomainEvent } from '../../../../shared-kernal/domain/events/domain.event';
import { RoleType } from '../../../../shared-kernal/domain/value-objects/role.vo';

export class UserRoleChangedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly previousRole: RoleType,
    public readonly newRole: RoleType,
  ) {
    super();
  }
}
