/**
 * Tipos mejorados para archivos con todos los campos necesarios
 */

export interface File {
  id: string;
  filename: string;
  folder_id: string;
  storage_path: string;
  size: number;
  mimetype: string;
  created_at: string;
  updated_at: string;
}

export interface FileInsert {
  id?: string;
  filename: string;
  folder_id: string;
  storage_path?: string;
  size?: number;
  mimetype?: string;
}

export interface FileUpdate {
  filename?: string;
  folder_id?: string;
  storage_path?: string;
  size?: number;
  mimetype?: string;
}

import { FileText, Image, FileArchive, FileCode, Music, Video, File } from 'lucide-react';

/**
 * Función auxiliar para formatear tamaños de archivo
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (filename: string) => {
  if (!filename) return File;
  
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    // Imágenes
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
    case 'svg':
    case 'bmp':
      return Image;
    
    // Documentos
    case 'pdf':
    case 'doc':
    case 'docx':
    case 'txt':
    case 'rtf':
    case 'odt':
      return FileText;
    
    // Archivos comprimidos
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return FileArchive;
    
    // Código
    case 'html':
    case 'css':
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'json':
    case 'xml':
    case 'py':
    case 'java':
    case 'c':
    case 'cpp':
    case 'php':
      return FileCode;
    
    // Audio
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'flac':
    case 'm4a':
      return Music;
    
    // Video
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
    case 'mkv':
    case 'webm':
      return Video;
    
    // Por defecto
    default:
      return File;
  }
};

/**
 * Función para obtener el tipo de archivo según extensión
 */
export const getFileType = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return 'image';
    case 'pdf':
      return 'pdf';
    case 'zip':
    case 'rar':
    case '7z':
      return 'archive';
    case 'doc':
    case 'docx':
    case 'txt':
      return 'document';
    default:
      return 'file';
  }
};
