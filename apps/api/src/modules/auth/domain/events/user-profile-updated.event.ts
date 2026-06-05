import { DomainEvent } from '../../../../shared-kernal/domain/events/domain.event';

export interface UserProfileChanges {
  name?: string;
  image?: string | null;
}

export class UserProfileUpdatedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly changes: UserProfileChanges,
  ) {
    super();
  }
}
