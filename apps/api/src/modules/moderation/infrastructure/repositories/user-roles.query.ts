import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { users } from '@chatty-nest/database';
import { DB_TOKEN, type DrizzleDb } from '../../../../app/database/types';
import type { RoleType } from '../../../../shared-kernal/domain/value-objects/role.vo';
import type { UserRolesQueryPort } from '../../application/ports/user-roles.query.port';

@Injectable()
export class UserRolesQueryImpl implements UserRolesQueryPort {
  constructor(
    @Inject(DB_TOKEN)
    private readonly db: DrizzleDb,
  ) {}

  async getRoles(userId: string): Promise<RoleType[] | null> {
    const [row] = await this.db
      .select({ roles: users.roles })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return row ? (row.roles as RoleType[]) : null;
  }
}
