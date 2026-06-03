import { Inject, Injectable } from '@nestjs/common';
import {
  CreateUserData,
  User,
  UsersRepositoryPort,
} from '../../application/ports/users.repository.port';
import { DB_TOKEN, type DrizzleDb } from '../../../../app/database/types';
import { UserDatabase, users } from '@chatty-nest/database';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class UsersRepositoryImpl implements UsersRepositoryPort {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async create(data: CreateUserData): Promise<User> {
    const now = new Date();
    const [user] = await this.db
      .insert(users)
      .values({
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role ?? 'USER',
        username: data.name.split('@')[0] ?? data.email,
        displayName: data.name,
        emailVerified: false,
        banned: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return this.toDomain(user);
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));

    if (!user) return null;
    return this.toDomain(user);
  }

  async exists(id: string): Promise<boolean> {
    const userOrNull = await this.findById(id);

    if (!userOrNull) return false;
    return true;
  }

  async existsAndActive(id: string): Promise<boolean> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.banned, false)));

    if (!user) return false;
    else return true;
  }

  private toDomain(record: UserDatabase): User {
    return {
      id: record.id,
      name: record.name,
      email: record.email,
      emailVerified: record.emailVerified,
      image: record.image,
      role: record.role,
      banned: record.banned ?? false,
      banReason: record.banReason,
      banExpires: record.banExpires,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
