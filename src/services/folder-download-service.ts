import JSZip from 'jszip';
import { fileService } from './supabase/file-service';
import { folderService } from './supabase/folder-service';
import type { File } from './supabase/file-service';
import type { Folder } from './supabase/folder-service';

export interface FolderDownloadProgress {
  current: number;
  total: number;
  currentFile: string;
}

export class FolderDownloadService {
  private zip: JSZip;
  private onProgress?: (progress: FolderDownloadProgress) => void;

  constructor(onProgress?: (progress: FolderDownloadProgress) => void) {
    this.zip = new JSZip();
    this.onProgress = onProgress;
  }

  /**
   * Descarga una carpeta completa como archivo ZIP
   */
  async downloadFolder(folder: Folder): Promise<void> {
    try {
      // Obtener todos los archivos y subcarpetas recursivamente
      const { files, totalCount } = await this.getAllFolderContents(folder.id);
      
      if (files.length === 0) {
        throw new Error('La carpeta está vacía');
      }

      // Crear el ZIP con todos los archivos
      await this.createZipFromFiles(files, totalCount);

      // Generar y descargar el archivo ZIP
      const zipBlob = await this.zip.generateAsync({ type: 'blob' });
      this.downloadBlob(zipBlob, `${folder.name}.zip`);

    } catch (error) {
      console.error('Error downloading folder:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los archivos de una carpeta de forma recursiva
   */
  private async getAllFolderContents(folderId: string, basePath: string = ''): Promise<{ files: Array<File & { relativePath: string }>, totalCount: number }> {
    const allFiles: Array<File & { relativePath: string }> = [];

    // Obtener archivos directos de esta carpeta
    const files = await fileService.getFilesByFolderId(folderId);
    for (const file of files) {
      allFiles.push({
        ...file,
        relativePath: basePath
      });
    }

    // Obtener subcarpetas y procesar recursivamente
    const subfolders = await folderService.getFoldersByParentId(folderId);
    for (const subfolder of subfolders) {
      const subfolderPath = basePath ? `${basePath}/${subfolder.name}` : subfolder.name;
      const { files: subFiles } = await this.getAllFolderContents(subfolder.id, subfolderPath);
      allFiles.push(...subFiles);
    }

    return { files: allFiles, totalCount: allFiles.length };
  }

  /**
   * Crea el archivo ZIP con todos los archivos
   */
  private async createZipFromFiles(files: Array<File & { relativePath: string }>, totalCount: number): Promise<void> {
    let processedCount = 0;

    for (const file of files) {
      try {
        // Actualizar progreso
        processedCount++;
        if (this.onProgress) {
          this.onProgress({
            current: processedCount,
            total: totalCount,
            currentFile: file.name
          });
        }

        // Descargar el archivo como blob
        const publicUrl = fileService.getPublicUrl(file.storage_path);
        const response = await fetch(publicUrl);
        
        if (!response.ok) {
          console.warn(`Failed to download file: ${file.name}`);
          continue;
        }

        const blob = await response.blob();

        // Agregar al ZIP con la ruta correcta
        const filePath = file.relativePath ? `${file.relativePath}/${file.name}` : file.name;
        this.zip.file(filePath, blob);

      } catch (error) {
        console.warn(`Error processing file ${file.name}:`, error);
        // Continuar con el siguiente archivo
      }
    }
  }

  /**
   * Descarga un blob como archivo
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
  }
}

/**
 * Función helper para descargar una carpeta
 */
export const downloadFolderAsZip = async (
  folder: Folder, 
  onProgress?: (progress: FolderDownloadProgress) => void
): Promise<void> => {
  const service = new FolderDownloadService(onProgress);
  await service.downloadFolder(folder);
};
