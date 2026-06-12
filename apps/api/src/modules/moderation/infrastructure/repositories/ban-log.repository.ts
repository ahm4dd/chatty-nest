import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { banEvents } from '@chatty-nest/database';
import { DB_TOKEN, type DrizzleDb, type Tx } from '../../../../app/database/types';
import { BanLogEntry } from '../../domain/entities/ban-log-entry.entity';
import type { BanLogRepositoryPort } from '../../application/ports/ban-log.repository.port';

function isForeignKeyViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as Record<string, unknown>).code === '23503';
}

@Injectable()
export class BanLogRepositoryImpl implements BanLogRepositoryPort {
  private readonly logger = new Logger(BanLogRepositoryImpl.name);

  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async save(entry: BanLogEntry, tx?: Tx): Promise<void> {
    const db = tx ?? this.db;
    const record = entry.toRecord();
    try {
      await db.insert(banEvents).values({
        id: record.id,
        userId: record.userId,
        action: record.action,
        reason: record.reason,
        expiresAt: record.expiresAt,
        createdBy: record.createdBy,
        createdAt: record.createdAt,
      });
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        const { NotFoundException } = await import('@nestjs/common');
        throw new NotFoundException(`User ${entry.userId} not found`);
      }
      throw error;
    }
  }

  async findActiveBan(userId: string, tx?: Tx): Promise<BanLogEntry | null> {
    const db = tx ?? this.db;
    const [latest] = await db
      .select()
      .from(banEvents)
      .where(eq(banEvents.userId, userId))
      .orderBy(desc(banEvents.createdAt))
      .limit(1);

    if (!latest) return null;

    try {
      const entry = BanLogEntry.reconstitute(latest);
      return entry.isActive() ? entry : null;
    } catch (error) {
      this.logger.error('ban_events row failed domain invariant', { userId, row: latest, error });
      return null;
    }
  }

  async findHistory(userId: string, tx?: Tx): Promise<BanLogEntry[]> {
    const db = tx ?? this.db;
    const records = await db
      .select()
      .from(banEvents)
      .where(eq(banEvents.userId, userId))
      .orderBy(desc(banEvents.createdAt))
      .limit(200);

    return records.map((r) => BanLogEntry.reconstitute(r));
  }
}
