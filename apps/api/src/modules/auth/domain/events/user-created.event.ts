import { DomainEvent } from '../../../../shared-kernal/domain/events/domain.event';
import { RoleType } from '../../../../shared-kernal/domain/value-objects/role.vo';

export class UserCreatedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly role: RoleType,
  ) {
    super();
  }
}
