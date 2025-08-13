import { AdminUser, Role, Permission } from '../types/auth';

export interface AdminService {
  getRoles(): Promise<Role[]>;
  getPermissions(): Promise<Permission[]>;
  getUserRoles(userId: string): Promise<string[]>;
  assignRoleToUser(userId: string, roleId: string): Promise<boolean>;
  removeRoleFromUser(userId: string, roleId: string): Promise<boolean>;
}

export const adminService: AdminService;
