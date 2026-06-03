import { DomainEvent } from '../events/domain.event';

export abstract class AggregateRoot {
  #events: DomainEvent[];

  constructor() {
    this.#events = [];
  }

  protected addEvent(event: DomainEvent) {
    this.#events.push(event);
  }

  getEvents(): DomainEvent[] {
    return [...this.#events];
  }

  clearEvents(): void {
    this.#events = [];
  }
}
