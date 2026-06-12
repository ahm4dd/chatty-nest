import { DomainEvent } from './domain.event';

export class UserBannedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly reason: string,
    public readonly expires: Date | null,
    public readonly createdBy: string | null,
  ) {
    super();
  }
}
