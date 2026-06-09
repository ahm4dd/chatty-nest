import { Inject, Injectable } from '@nestjs/common';
import {
  UsersRepositoryPort,
} from '../../application/ports/users.repository.port';
import { User } from '../../domain/aggregates/user.aggregate';
import { DB_TOKEN, type DrizzleDb, type Tx } from '../../../../app/database/types';
import { users } from '@chatty-nest/database';
import { eq } from 'drizzle-orm';

@Injectable()
export class UsersRepositoryImpl implements UsersRepositoryPort {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async save(user: User, tx?: Tx): Promise<User> {
    const db = tx ?? this.db;
    const record = user.toRecord();

    const base = user.email.split('@')[0] ?? user.email;
    const username = await this.#generateUniqueUsername(base, db);

    await db.insert(users).values({
      ...record,
      username,
      displayUsername: username,
      displayName: user.name,
    }).onConflictDoUpdate({
      target: users.id,
      set: {
        name: record.name,
        email: record.email,
        emailVerified: record.emailVerified,
        image: record.image,
        role: record.role,
        banned: record.banned,
        banReason: record.banReason,
        banExpires: record.banExpires,
        updatedAt: new Date(),
      },
    });

    return user;
  }

  async #generateUniqueUsername(base: string, db: DrizzleDb | Tx): Promise<string> {
    let username = base;
    let counter = 0;

    while (counter < 10) {
      const [existing] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (!existing) return username;
      counter++;
      username = `${base}${counter}`;
    }

    throw new Error('Unable to generate unique username');
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
    const user = await this.findById(id);

    return user?.isActive() ?? false;
  }
}
