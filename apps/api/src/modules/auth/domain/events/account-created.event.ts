import { DomainEvent } from '../../../../shared-kernal/domain/events/domain.event';
import type { AuthProvider } from '../value-objects/auth-provider.vo';

export class AccountCreatedEvent extends DomainEvent {
  constructor(
    public readonly accountId: string,
    public readonly userId: string,
    public readonly providerId: AuthProvider,
    public readonly accountIdentifier: string,
  ) {
    super();
  }
}
