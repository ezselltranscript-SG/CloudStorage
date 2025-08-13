import React from 'react';

export interface FileExplorerProps {
  currentFolderId?: string | null;
  onFolderClick?: (folderId: string | null) => void;
  isSharedView?: boolean;
  isTrashView?: boolean;
}

export const FileExplorer: React.FC<FileExplorerProps>;
