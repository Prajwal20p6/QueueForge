import { Role, User } from '../types/admin.types';
import { generateUUID } from '../../../shared/utils/crypto';

/**
 * Service managing RBAC roles, permissions, and admin user accounts.
 */
export class RoleService {
  private roles = new Map<string, Role>();
  private users = new Map<string, User>();

  constructor() {
    // Seed default admin role
    const adminRole: Role = { id: 'role-admin', name: 'Admin', permissions: ['*'] };
    this.roles.set(adminRole.id, adminRole);
  }

  public async listRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  public async createRole(name: string, permissions: string[]): Promise<Role> {
    const role: Role = { id: generateUUID(), name, permissions };
    this.roles.set(role.id, role);
    return role;
  }

  public async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  public async createUser(email: string, name: string, roleIds: string[]): Promise<User> {
    const assignedRoles = roleIds.map(id => this.roles.get(id)).filter(Boolean) as Role[];
    const user: User = { id: generateUUID(), email, name, roles: assignedRoles };
    this.users.set(user.id, user);
    return user;
  }
}
