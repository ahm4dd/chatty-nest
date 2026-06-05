import { DomainEvent } from '../../../../shared-kernal/domain/events/domain.event';

export class UserBannedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly reason: string,
    public readonly expires: Date | null,
  ) {
    super();
  }
}
