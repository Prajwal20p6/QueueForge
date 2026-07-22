/**
 * Supported authorization role classifications within QueueForge.
 */
export enum Role {
  ADMIN = 'ADMIN',
  DEVELOPER = 'DEVELOPER',
  SERVICE = 'SERVICE',
  VIEWER = 'VIEWER',
}

/**
 * Fine-grained system permissions governing API endpoints and domain capabilities.
 */
export enum Permission {
  READ = 'READ',
  WRITE = 'WRITE',
  DELETE = 'DELETE',
  ADMIN = 'ADMIN',
  VIEW_LOGS = 'VIEW_LOGS',
  MANAGE_USERS = 'MANAGE_USERS',
}

/**
 * Role-to-permission mapping dictionary.
 */
export const ROLE_PERMISSIONS_MAP: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.READ,
    Permission.WRITE,
    Permission.DELETE,
    Permission.ADMIN,
    Permission.VIEW_LOGS,
    Permission.MANAGE_USERS,
  ],
  [Role.DEVELOPER]: [
    Permission.READ,
    Permission.WRITE,
    Permission.DELETE,
    Permission.VIEW_LOGS,
  ],
  [Role.SERVICE]: [
    Permission.READ,
    Permission.WRITE,
  ],
  [Role.VIEWER]: [
    Permission.READ,
  ],
};

/**
 * Evaluates and returns the full list of permissions assigned to a given Role.
 */
export function getRolePermissions(role: Role | string): Permission[] {
  const normalized = String(role).toUpperCase() as Role;
  return ROLE_PERMISSIONS_MAP[normalized] || [Permission.READ];
}

/**
 * Access Control utility class encapsulating permission lookup methods.
 */
export class AccessControl {
  public static getPermissions(role: Role | string): Permission[] {
    return getRolePermissions(role);
  }

  public static hasPermission(role: Role | string, permission: Permission | string): boolean {
    const perms = getRolePermissions(role);
    const target = String(permission).toUpperCase() as Permission;
    return perms.includes(target);
  }
}
