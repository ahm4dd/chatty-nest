import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt } from 'drizzle-orm';
import { sessions } from '@chatty-nest/database';
import { DB_TOKEN, type DrizzleDb, type Tx } from '../../../../app/database/types';
import { Session } from '../../domain/entities/session.entity';
import type { SessionsRepositoryPort } from '../../application/ports/sessions.repository.port';

@Injectable()
export class SessionsRepositoryImpl implements SessionsRepositoryPort {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async save(session: Session, tx?: Tx): Promise<void> {
    const db = tx ?? this.db;
    const data = {
      id: session.id,
      userId: session.userId,
      token: session.token,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    };

    const existing = await this.findById(session.id, tx);

    if (existing) {
      await db
        .update(sessions)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(sessions.id, session.id));
    } else {
      await db.insert(sessions).values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  async findById(id: string, tx?: Tx): Promise<Session | null> {
    const db = tx ?? this.db;
    const [record] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);

    if (!record) return null;
    return this.toDomain(record);
  }

  async findByToken(token: string, tx?: Tx): Promise<Session | null> {
    const db = tx ?? this.db;
    const [record] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token))
      .limit(1);

    if (!record) return null;
    return this.toDomain(record);
  }

  async findActiveByUserId(userId: string): Promise<Session[]> {
    const records = await this.db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          gt(sessions.expiresAt, new Date()),
        ),
      );

    return records.map((record) => this.toDomain(record));
  }

  async delete(id: string, tx?: Tx): Promise<boolean> {
    const db = tx ?? this.db;
    const result = await db.delete(sessions).where(eq(sessions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteAllByUserId(userId: string, tx?: Tx): Promise<number> {
    const db = tx ?? this.db;
    const result = await db.delete(sessions).where(eq(sessions.userId, userId));
    return result.rowCount ?? 0;
  }

  private toDomain(record: typeof sessions.$inferSelect): Session {
    return Session.reconstitute(
      record.id,
      record.userId,
      record.token,
      record.expiresAt,
      record.ipAddress,
      record.userAgent,
      record.createdAt,
    );
  }
}
