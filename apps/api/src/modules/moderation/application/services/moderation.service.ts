import { randomUUID } from 'node:crypto';

import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { RoleType } from '../../../../shared-kernal/domain/value-objects/role.vo';
import { ROLE_HIERARCHY } from '../../../../shared-kernal/domain/value-objects/role.vo';
import { DomainEventsPublisher } from '../../../../app/events/domain-events-publisher.service';
import { UserBannedEvent } from '../../../../shared-kernal/domain/events/user-banned.event';
import { UserUnbannedEvent } from '../../../../shared-kernal/domain/events/user-unbanned.event';
import { BanLogEntry } from '../../domain/entities/ban-log-entry.entity';
import { BAN_LOG_REPOSITORY_TOKEN, USER_ROLES_QUERY_TOKEN } from '../ports/tokens';
import type { BanLogRepositoryPort } from '../ports/ban-log.repository.port';
import type { UserRolesQueryPort } from '../ports/user-roles.query.port';
import type { BanActionResponseDto } from '../../presentation/dto/response/ban-action-response.dto';
import type { UnbanActionResponseDto } from '../../presentation/dto/response/unban-action-response.dto';
import type { BanStatusResponseDto } from '../../presentation/dto/response/ban-status-response.dto';
import { toBanLogEntryDto } from '../../presentation/dto/response/ban-log-entry.dto';

function highestRank(roles: RoleType[]): number {
  return Math.max(...roles.map((r) => ROLE_HIERARCHY.indexOf(r)), -1);
}

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    @Inject(BAN_LOG_REPOSITORY_TOKEN)
    private readonly banLogRepository: BanLogRepositoryPort,
    @Inject(USER_ROLES_QUERY_TOKEN)
    private readonly userRolesQuery: UserRolesQueryPort,
    private readonly domainEventsPublisher: DomainEventsPublisher,
  ) {}

  async banUser(actorId: string, targetUserId: string, reason?: string, expiresAtIso?: string): Promise<BanActionResponseDto> {
    await this.assertCanModerate(actorId, targetUserId);

    const existing = await this.banLogRepository.findActiveBan(targetUserId);
    if (existing) {
      return { userId: targetUserId, isBanned: true, ban: toBanLogEntryDto(existing), alreadyBanned: true };
    }

    let entry: BanLogEntry;
    try {
      entry = BanLogEntry.createBan(
        randomUUID(), targetUserId, reason,
        expiresAtIso ? new Date(expiresAtIso) : undefined,
        actorId,
      );
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid ban parameters');
    }

    await this.banLogRepository.save(entry);

    try {
      await this.domainEventsPublisher.publish(
        new UserBannedEvent(entry.userId, entry.reason ?? '', entry.expiresAt, entry.createdBy),
      );
    } catch (error) {
      this.logger.error('Failed to publish UserBannedEvent', error);
    }

    return { userId: targetUserId, isBanned: true, ban: toBanLogEntryDto(entry), alreadyBanned: false };
  }

  async unbanUser(actorId: string, targetUserId: string, reason?: string): Promise<UnbanActionResponseDto> {
    await this.assertCanModerate(actorId, targetUserId);

    const existing = await this.banLogRepository.findActiveBan(targetUserId);
    if (!existing) {
      return { userId: targetUserId, isBanned: false, alreadyUnbanned: true };
    }

    const entry = BanLogEntry.createUnban(randomUUID(), targetUserId, reason, actorId);
    await this.banLogRepository.save(entry);

    try {
      await this.domainEventsPublisher.publish(
        new UserUnbannedEvent(entry.userId, entry.reason, entry.createdBy),
      );
    } catch (error) {
      this.logger.error('Failed to publish UserUnbannedEvent', error);
    }

    return { userId: targetUserId, isBanned: false, alreadyUnbanned: false };
  }

  async getBanStatus(userId: string): Promise<BanStatusResponseDto> {
    const history = await this.banLogRepository.findHistory(userId);
    const latest = history[0] ?? null;
    const activeBan = latest?.isActive() ? latest : null;

    return {
      userId,
      isBanned: activeBan !== null,
      activeBan: activeBan ? toBanLogEntryDto(activeBan) : null,
      history: history.map(toBanLogEntryDto),
    };
  }

  private async assertCanModerate(actorId: string, targetUserId: string): Promise<void> {
    if (actorId === targetUserId) {
      throw new ForbiddenException('You cannot moderate your own account');
    }

    const targetRoles = await this.userRolesQuery.getRoles(targetUserId);
    if (targetRoles === null) {
      throw new NotFoundException(`User ${targetUserId} not found`);
    }

    const actorRoles = await this.userRolesQuery.getRoles(actorId);
    const actorRank = highestRank(actorRoles ?? []);
    const targetRank = highestRank(targetRoles);

    if (targetRank >= actorRank) {
      throw new ForbiddenException('Cannot moderate a user with equal or higher privileges');
    }
  }
}
