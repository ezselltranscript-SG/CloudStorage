import React from 'react';
import type { File } from '../../services/supabase/file-service';

export interface FileItemProps {
  file: File;
  onClick: () => void;
  className?: string;
  onRename?: (file: File) => void;
  onDelete?: (file: File) => void;
  onDownload?: (file: File) => void;
}

export const FileItem: React.FC<FileItemProps>;
