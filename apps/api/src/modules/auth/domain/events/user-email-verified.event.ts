import { DomainEvent } from '../../../../shared-kernal/domain/events/domain.event';

export class UserEmailVerifiedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {
    super();
  }
}
