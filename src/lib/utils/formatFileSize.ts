/**
 * Formatea el tamaño de un archivo en bytes a una representación legible
 * @param bytes - Tamaño en bytes
 * @returns Tamaño formateado (ej: "1.5 MB", "256 KB")
 */
export const formatFileSize = (bytes: number | null): string => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
