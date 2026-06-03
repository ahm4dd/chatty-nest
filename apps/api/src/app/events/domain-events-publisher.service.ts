import { Injectable } from '@nestjs/common';
import { AggregateRoot } from '../../shared-kernal/domain/aggregates/root.aggregate';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from '../../shared-kernal/domain/events/domain.event';

@Injectable()
export class DomainEventsPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async publishEventsForAggregate(aggregate: AggregateRoot) {
    const events = aggregate.getEvents();
    for (const event of events) {
      await this.publish(event);
    }

    aggregate.clearEvents();
  }

  async publish(event: DomainEvent): Promise<void> {
    await this.eventEmitter.emitAsync(event.eventName, event);
  }
}
