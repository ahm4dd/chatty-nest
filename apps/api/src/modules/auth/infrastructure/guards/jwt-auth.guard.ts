import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../../../../shared-kernal/infrastructure/decorators/public.decorator';
import { ROLES_KEY } from '../../../../shared-kernal/infrastructure/decorators/roles.decorator';
import type { RoleType } from '../../../../shared-kernal/domain/value-objects/role.vo';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (shouldBypassJwtAuth(this.reflector, context)) {
      return true;
    }

    return super.canActivate(context);
  }
}

export function shouldBypassJwtAuth(
  reflector: Reflector,
  context: ExecutionContext,
): boolean {
  const isPublicRoute = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
    context.getHandler(),
    context.getClass(),
  ]);
  const requiredRoles = reflector.getAllAndOverride<RoleType[]>(ROLES_KEY, [
    context.getHandler(),
    context.getClass(),
  ]);

  return isPublicRoute === true && !requiredRoles?.length;
}
