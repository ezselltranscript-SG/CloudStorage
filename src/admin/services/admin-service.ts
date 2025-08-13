import { supabase } from '../../lib/supabase';
import type { Role, Permission } from '../types/auth';

/**
 * Servicio para gestionar operaciones administrativas
 */
class AdminService {
  /**
   * Obtiene todos los roles disponibles en el sistema
   */
  async getRoles(): Promise<Role[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('*');
    
    if (error) {
      console.error('Error al obtener roles:', error);
      throw new Error('No se pudieron cargar los roles');
    }
    
    return data || [];
  }

  /**
   * Obtiene todos los permisos disponibles en el sistema
   */
  async getPermissions(): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('permissions')
      .select('*');
    
    if (error) {
      console.error('Error al obtener permisos:', error);
      throw new Error('No se pudieron cargar los permisos');
    }
    
    return data || [];
  }

  /**
   * Obtiene los roles asignados a un usuario específico
   */
  async getUserRoles(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error al obtener roles del usuario:', error);
      throw new Error('No se pudieron cargar los roles del usuario');
    }
    
    return (data || []).map((item: { role_id: string }) => item.role_id);
  }

  /**
   * Asigna un rol a un usuario
   */
  async assignRoleToUser(userId: string, roleId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role_id: roleId });
    
    if (error) {
      console.error('Error al asignar rol:', error);
      throw new Error('No se pudo asignar el rol al usuario');
    }
    
    return true;
  }

  /**
   * Elimina un rol de un usuario
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);
    
    if (error) {
      console.error('Error al eliminar rol:', error);
      throw new Error('No se pudo eliminar el rol del usuario');
    }
    
    return true;
  }
}

export const adminService = new AdminService();
