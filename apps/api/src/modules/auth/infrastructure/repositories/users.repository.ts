import { Inject, Injectable } from '@nestjs/common';
import {
  UsersRepositoryPort,
} from '../../application/ports/users.repository.port';
import { User } from '../../domain/aggregates/user.aggregate';
import { DB_TOKEN, type DrizzleDb, type Tx } from '../../../../app/database/types';
import { users } from '@chatty-nest/database';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class UsersRepositoryImpl implements UsersRepositoryPort {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async save(user: User, tx?: Tx): Promise<User> {
    const db = tx ?? this.db;
    const existing = await this.findById(user.id, tx);

    if (!existing) {
      await db.insert(users).values({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        username: user.email.split('@')[0] ?? user.email,
        displayName: user.name,
        emailVerified: user.emailVerified,
        banned: user.banned,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      });
    } else {
      await db
        .update(users)
        .set({
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
          role: user.role,
          banned: user.banned,
          banReason: user.banReason,
          banExpires: user.banExpires,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    }

    return user;
  }

  async findById(id: string, tx?: Tx): Promise<User | null> {
    const db = tx ?? this.db;
    const [record] = await db.select().from(users).where(eq(users.id, id));

    if (!record) return null;
    return User.from(record);
  }

  async exists(id: string): Promise<boolean> {
    const userOrNull = await this.findById(id);

    if (!userOrNull) return false;
    return true;
  }

  async existsAndActive(id: string): Promise<boolean> {
    const [record] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.banned, false)));

    if (!record) return false;
    else return true;
  }
}
