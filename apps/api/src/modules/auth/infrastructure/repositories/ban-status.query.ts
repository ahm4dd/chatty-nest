import { Inject, Injectable } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { banEvents } from '@chatty-nest/database';
import { DB_TOKEN, type DrizzleDb, type Tx } from '../../../../app/database/types';
import type { BanStatus, BanStatusQueryPort } from '../../application/ports/ban-status.query.port';

@Injectable()
export class BanStatusQueryImpl implements BanStatusQueryPort {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async getBanStatus(userId: string, tx?: Tx): Promise<BanStatus> {
    const db = tx ?? this.db;
    const NOT_BANNED: BanStatus = { isBanned: false, reason: null, expiresAt: null };

    const [latest] = await db
      .select({
        action: banEvents.action,
        reason: banEvents.reason,
        expiresAt: banEvents.expiresAt,
      })
      .from(banEvents)
      .where(eq(banEvents.userId, userId))
      .orderBy(desc(banEvents.createdAt))
      .limit(1);

    if (!latest || latest.action === 'UNBANNED') return NOT_BANNED;
    if (latest.expiresAt && latest.expiresAt <= new Date()) return NOT_BANNED;

    return { isBanned: true, reason: latest.reason, expiresAt: latest.expiresAt };
  }
}
