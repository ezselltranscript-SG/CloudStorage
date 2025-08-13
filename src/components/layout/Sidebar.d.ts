import React from 'react';

export interface SidebarProps {
  className?: string;
  currentFolderId: string | null;
  onFolderClick: (folderId: string | null) => void;
}

export const Sidebar: React.FC<SidebarProps>;
