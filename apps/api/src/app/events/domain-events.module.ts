import { Global, Module } from '@nestjs/common';
import { DomainEventsPublisher } from './domain-events-publisher.service';

@Global()
@Module({
  providers: [DomainEventsPublisher],
  exports: [DomainEventsPublisher],
})
export class DomainEventsModule {}
