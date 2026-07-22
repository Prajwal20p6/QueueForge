import { Request, Response, NextFunction } from 'express';
import { RoleService } from '../services/role-service';

/**
 * REST controller managing RBAC roles, user permissions, and assignments.
 */
export class RoleManagerController {
  constructor(private readonly roleService: RoleService) {}

  public listRoles = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = await this.roleService.listRoles();
      res.status(200).json({ success: true, data: roles });
    } catch (err) {
      next(err);
    }
  };

  public createRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, permissions } = req.body;
      const role = await this.roleService.createRole(name, permissions || []);
      res.status(201).json({ success: true, data: role });
    } catch (err) {
      next(err);
    }
  };

  public listUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await this.roleService.listUsers();
      res.status(200).json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  };

  public createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, name, roleIds } = req.body;
      const user = await this.roleService.createUser(email, name, roleIds || []);
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  };
}
