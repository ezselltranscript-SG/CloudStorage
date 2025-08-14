import React from 'react';

export interface FileExplorerProps {
  currentFolderId: string | null;
  onFolderClick: (folderId: string | null) => void;
}

export const FileExplorer: React.FC<FileExplorerProps>;
