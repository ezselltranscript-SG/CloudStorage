import { supabase } from './supabase-client';

/**
 * Utilidades para generar storage paths consistentes basados en jerarquía real de carpetas
 */

/**
 * Construye la ruta completa de una carpeta desde la raíz
 * @param folderId - ID de la carpeta
 * @returns Ruta completa de la carpeta (ej: "Documents/Projects/MyProject")
 */
export async function buildFolderPath(folderId: string | null): Promise<string> {
  if (!folderId) return 'root';

  // Construir la ruta completa usando recursión
  const { data: folder, error } = await supabase
    .from('folders')
    .select('id, name, parent_id')
    .eq('id', folderId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !folder) {
    console.warn(`Folder ${folderId} not found, using root`);
    return 'root';
  }

  // Si tiene padre, construir ruta recursivamente
  if (folder.parent_id) {
    const parentPath = await buildFolderPath(folder.parent_id);
    return `${parentPath}/${folder.name}`;
  }

  // Es carpeta raíz
  return folder.name;
}

/**
 * Genera el storage path correcto para un archivo
 * @param userId - ID del usuario
 * @param folderId - ID de la carpeta (null para raíz)
 * @param fileId - ID del archivo
 * @param filename - Nombre del archivo con extensión
 * @returns Storage path correcto (ej: "userId/Documents/Projects/fileId.pdf")
 */
export async function generateStoragePath(
  userId: string,
  folderId: string | null,
  fileId: string,
  filename: string
): Promise<string> {
  const folderPath = await buildFolderPath(folderId);
  const fileExt = filename.split('.').pop() || 'bin';
  
  return `${userId}/${folderPath}/${fileId}.${fileExt}`;
}

/**
 * Valida que una carpeta padre existe y pertenece al usuario
 * @param parentId - ID de la carpeta padre
 * @param userId - ID del usuario
 * @returns true si es válida, false si no
 */
export async function validateParentFolder(
  parentId: string | null,
  userId: string
): Promise<boolean> {
  if (!parentId) return true; // null es válido (carpeta raíz)

  const { data: folder, error } = await supabase
    .from('folders')
    .select('id, user_id')
    .eq('id', parentId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .maybeSingle();

  return !error && !!folder;
}

/**
 * Obtiene la jerarquía completa de una carpeta
 * @param folderId - ID de la carpeta
 * @returns Array de carpetas desde raíz hasta la carpeta especificada
 */
export async function getFolderHierarchy(folderId: string | null): Promise<Array<{id: string, name: string}>> {
  if (!folderId) return [];

  const hierarchy: Array<{id: string, name: string}> = [];
  let currentId = folderId;

  while (currentId) {
    const { data: folder, error } = await supabase
      .from('folders')
      .select('id, name, parent_id')
      .eq('id', currentId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !folder) break;

    hierarchy.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parent_id;
  }

  return hierarchy;
}
