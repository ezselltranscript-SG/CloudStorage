import React from 'react';
import type { Folder } from '../../services/supabase/folder-service';

export interface FolderItemProps {
  folder: Folder;
  onClick: () => void;
  className?: string;
  onRename?: (folder: Folder) => void;
  onDelete?: (folder: Folder) => void;
}

export const FolderItem: React.FC<FolderItemProps>;
