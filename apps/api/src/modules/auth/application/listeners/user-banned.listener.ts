import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserBannedEvent } from '../../../../shared-kernal/domain/events/user-banned.event';
import { SESSIONS_REPOSITORY_TOKEN } from '../ports/tokens';
import type { SessionsRepositoryPort } from '../ports/sessions.repository.port';

@Injectable()
export class UserBannedListener {
  constructor(
    @Inject(SESSIONS_REPOSITORY_TOKEN)
    private readonly sessionsRepository: SessionsRepositoryPort,
  ) {}

  @OnEvent(UserBannedEvent.name)
  async handle(event: UserBannedEvent) {
    await this.sessionsRepository.deleteAllByUserId(event.userId);
  }
}
