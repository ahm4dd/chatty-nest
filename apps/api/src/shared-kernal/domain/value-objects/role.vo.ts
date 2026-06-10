/**
 * Role enums for runtime
 */
export const ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES];

/**
 * Role hierarchy, the higher the index, the higher the role
 *
 * @example
 * ['USER', 'ADMIN']
 */
export const ROLE_HIERARCHY: RoleType[] = ['USER', 'ADMIN'];

/**
 * Checks whether a role satisfies the required minimum role.
 *
 * @param actorRole - The role of the actor
 * @param requiredRole - The minimum required role
 */
export function hasRequiredRole(
  actorRole: RoleType,
  requiredRole: RoleType,
): boolean {
  const actorRoleIndex = ROLE_HIERARCHY.indexOf(actorRole);
  const requiredRoleIndex = ROLE_HIERARCHY.indexOf(requiredRole);

  return actorRoleIndex >= requiredRoleIndex;
}
