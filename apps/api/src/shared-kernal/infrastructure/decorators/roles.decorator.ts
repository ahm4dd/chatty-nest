import { SetMetadata } from '@nestjs/common';
import { RoleType } from '../../domain/value-objects/role.vo';

/**
 * Role-based authorization decorator
 *
 * Used with RolesGuard to specify the minimum role required to access the route.
 *
 * @example
 * @Roles('ADMIN')
 * @Get('admin-only')
 */
export const Roles = (...roles: RoleType[]) => SetMetadata('roles', roles);
