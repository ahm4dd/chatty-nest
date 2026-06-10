import { randomBytes } from 'node:crypto';

import { ConflictException, Inject, Injectable } from '@nestjs/common';
import {
  UsersRepositoryPort,
} from '../../application/ports/users.repository.port';
import { User } from '../../domain/aggregates/user.aggregate';
import { DB_TOKEN, type DrizzleDb, type Tx } from '../../../../app/database/types';
import { users } from '@chatty-nest/database';
import { eq } from 'drizzle-orm';

const MAX_USERNAME_INSERT_ATTEMPTS = 10;
const DETERMINISTIC_USERNAME_ATTEMPTS = 3;
const UNIQUE_VIOLATION_CODE = '23505';

@Injectable()
export class UsersRepositoryImpl implements UsersRepositoryPort {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async save(user: User, tx?: Tx): Promise<User> {
    const db = tx ?? this.db;
    const record = user.toRecord();

    const updated = await db.update(users).set({
      name: record.name,
      email: record.email,
      username: record.username,
      displayUsername: record.displayUsername,
      displayName: record.displayName,
      bio: record.bio,
      preferences: record.preferences,
      emailVerified: record.emailVerified,
      image: record.image,
      role: record.role,
      banned: record.banned,
      banReason: record.banReason,
      banExpires: record.banExpires,
      updatedAt: new Date(),
    }).where(eq(users.id, user.id)).returning({ id: users.id });

    if (updated.length > 0) return user;

    const usernameBase = record.username;

    for (let attempt = 0; attempt < MAX_USERNAME_INSERT_ATTEMPTS; attempt++) {
      const username = createUsernameCandidate(usernameBase, attempt);
      const inserted = await db.insert(users).values({
        ...record,
        username,
        displayUsername: username,
      }).onConflictDoNothing({
        target: users.username,
      }).returning({ id: users.id }).catch((error: unknown) => {
        if (isUniqueConstraintViolation(error)) {
          throw new ConflictException('User already exists');
        }

        throw error;
      });

      if (inserted.length > 0) return user;
    }

    throw new ConflictException('Unable to generate unique username');
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

function createUsernameCandidate(base: string, attempt: number): string {
  if (attempt === 0) return base;
  if (attempt < DETERMINISTIC_USERNAME_ATTEMPTS) {
    return `${base}${attempt}`;
  }

  return `${base}-${randomBytes(3).toString('hex')}`;
}

function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === UNIQUE_VIOLATION_CODE
  );
}
