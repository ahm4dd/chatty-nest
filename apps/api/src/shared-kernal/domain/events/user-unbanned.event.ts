import { DomainEvent } from './domain.event';

export class UserUnbannedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly reason: string | null,
    public readonly createdBy: string | null,
  ) {
    super();
  }
}
