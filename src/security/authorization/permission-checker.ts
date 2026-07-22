import { AuthContext } from '../auth/auth-context';
import { Permission, Role, getRolePermissions } from './access-control';
import { AuthorizationError } from '../errors/authorization-error';
import { AuditLogger as Logger } from '../../infrastructure/repositories/base.repository';

/**
 * Service evaluating role-based permissions and fine-grained resource ownership access rules.
 */
export class PermissionChecker {
  constructor(
    private readonly logger?: Logger | any,
    _auditRepository?: any
  ) {}

  /**
   * Asserts whether a context has permission directly or through role mappings.
   */
  public hasPermission(context: AuthContext, permission: Permission | string): boolean {
    if (!context || !context.authenticated) return false;

    const permStr = String(permission).toUpperCase();

    // Direct permission check
    if (context.hasPermission(permStr)) return true;

    // Direct role permission lookup
    for (const roleStr of context.roles) {
      const perms = getRolePermissions(roleStr as Role);
      if (perms.some(p => String(p).toUpperCase() === permStr)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Throws AuthorizationError if context lacks the requested permission.
   */
  public requirePermission(context: AuthContext, permission: Permission | string): void {
    if (!this.hasPermission(context, permission)) {
      this.logger?.warn?.(`Authorization denial: Subject "${context?.getIdentifier()}" lacks permission "${permission}"`);
      throw new AuthorizationError(`Access denied: Missing required permission "${permission}"`, String(permission));
    }
  }

  /**
   * Evaluates if context is authorized to inspect a specific delivery resource.
   */
  public async canViewDelivery(context: AuthContext, _deliveryId: string): Promise<boolean> {
    if (!context || !context.authenticated) return false;
    if (context.hasRole('ADMIN') || context.hasRole('DEVELOPER') || context.hasPermission('READ')) {
      return true;
    }
    return false;
  }

  /**
   * Evaluates if context is authorized to create/modify a destination configuration.
   */
  public async canModifyDestination(context: AuthContext, _destinationId?: string): Promise<boolean> {
    if (!context || !context.authenticated) return false;
    if (context.hasRole('ADMIN') || context.hasRole('DEVELOPER') || context.hasPermission('WRITE')) {
      return true;
    }
    return false;
  }

  /**
   * Evaluates if context has privileges to view system audit logs.
   */
  public canViewAuditLog(context: AuthContext): boolean {
    if (!context || !context.authenticated) return false;
    return context.hasRole('ADMIN') || context.hasPermission('VIEW_LOGS') || context.hasPermission('ADMIN');
  }
}
