/**
 * Role enums for runtime
 */
export const ROLES = {
  ADMIN: 'ADMIN',
  SUPPORT: 'SUPPORT',
  MODERATOR: 'MODERATOR',
  USER: 'USER',
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];

/**
 * Role hierarchy, the higher the index, the higher the role
 *
 * @example
 * ['USER', 'ADMIN']
 */
export const ROLE_HIERARCHY: RoleType[] = ['USER', 'SUPPORT', 'MODERATOR', 'ADMIN'];

/**
 * Checks whether any of the actor roles satisfies the required minimum role.
 *
 * @param actorRoles - The roles of the actor
 * @param requiredRole - The minimum required role
 */
export function hasRequiredRole(actorRoles: RoleType[], requiredRole: RoleType): boolean {
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);
  return actorRoles.some((role) => ROLE_HIERARCHY.indexOf(role) >= requiredIndex);
}
