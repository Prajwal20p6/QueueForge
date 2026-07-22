import { Role, Permission, getRolePermissions } from './access-control';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';

/**
 * Utility asserting validity of role strings, permission tokens, and role-permission mappings.
 */
export class RoleValidator {
  constructor(_logger?: Logger | any) {}

  /**
   * Asserts whether a role string is a recognized Role enum value.
   */
  public validateRole(role: string): boolean {
    if (!role || typeof role !== 'string') return false;
    const target = role.toUpperCase();
    return Object.values(Role).includes(target as Role);
  }

  /**
   * Asserts whether a permission string is a recognized Permission enum value.
   */
  public validatePermission(permission: string): boolean {
    if (!permission || typeof permission !== 'string') return false;
    const target = permission.toUpperCase();
    return Object.values(Permission).includes(target as Permission);
  }

  /**
   * Asserts whether a given permission is granted to a target role.
   */
  public validateRolePermissionMapping(role: Role | string, permission: Permission | string): boolean {
    if (!this.validateRole(String(role)) || !this.validatePermission(String(permission))) {
      return false;
    }
    const perms = getRolePermissions(role as Role);
    const targetPerm = String(permission).toUpperCase() as Permission;
    return perms.includes(targetPerm);
  }
}
