import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType } from '../../../../shared-kernal/domain/value-objects/role.vo';
import { hasRequiredRole } from '../../../../shared-kernal/domain/value-objects/role.vo';
import { USERS_REPOSITORY_TOKEN } from '../../application/ports/tokens';
import type { UsersRepositoryPort } from '../../application/ports/users.repository.port';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly usersRepository: UsersRepositoryPort,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    if (!userId) return false;

    const user = await this.usersRepository.findById(userId);
    if (!user) return false;

    return hasRequiredRole(user.role, requiredRoles[0]);
  }
}
