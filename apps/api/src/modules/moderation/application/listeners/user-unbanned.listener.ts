import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserUnbannedEvent } from '../../../../shared-kernal/domain/events/user-unbanned.event';

@Injectable()
export class UserUnbannedListener {
  private readonly logger = new Logger(UserUnbannedListener.name);

  @OnEvent(UserUnbannedEvent.name)
  async handle(event: UserUnbannedEvent): Promise<void> {
    this.logger.log(`User ${event.userId} was unbanned`);
  }
}
