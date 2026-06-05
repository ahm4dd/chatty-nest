import { DomainEvent } from '../../../../shared-kernal/domain/events/domain.event';

export class UserUnbannedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly previousBanReason: string | null,
  ) {
    super();
  }
}
