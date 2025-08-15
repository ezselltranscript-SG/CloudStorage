import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileExplorer } from '../file-explorer/FileExplorer';

export const FileExplorerPage: React.FC = () => {
  const { folderId } = useParams<{ folderId?: string }>();
  const navigate = useNavigate();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(folderId || null);

  // Sync state with URL params when they change
  useEffect(() => {
    setCurrentFolderId(folderId || null);
  }, [folderId]);

  const handleFolderClick = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    if (folderId) {
      navigate(`/folder/${folderId}`);
    } else {
      navigate('/');
    }
  };

  return (
    <FileExplorer 
      currentFolderId={currentFolderId}
      onFolderClick={handleFolderClick}
    />
  );
};

export const SharedFilesPage: React.FC = () => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const handleFolderClick = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    // Para shared files, mantenemos la navegación en la misma vista
  };

  return (
    <FileExplorer 
      currentFolderId={currentFolderId}
      onFolderClick={handleFolderClick}
    />
  );
};
