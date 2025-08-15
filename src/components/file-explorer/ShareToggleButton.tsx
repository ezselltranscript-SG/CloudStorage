import React from 'react';
import { Users, Lock } from 'lucide-react';
import { useToggleFileSharing } from '../../hooks/useFiles';
import { useToggleFolderSharing } from '../../hooks/useFolders';
import { useToast } from '../../contexts/ToastContext';

interface ShareToggleButtonProps {
  item: {
    id: string;
    is_shared: boolean;
    user_id: string;
    name?: string;
    filename?: string;
  };
  type: 'file' | 'folder';
  currentUserId?: string;
}

export const ShareToggleButton: React.FC<ShareToggleButtonProps> = ({
  item,
  type,
  currentUserId
}) => {
  const { showSuccess, showError } = useToast();
  const toggleFileSharing = useToggleFileSharing();
  const toggleFolderSharing = useToggleFolderSharing();

  const isOwner = currentUserId === item.user_id;
  const itemName = item.name || 'Unknown';

  const handleToggleSharing = async () => {
    if (!isOwner) {
      showError('Permission Denied', 'Only the owner can change sharing settings');
      return;
    }

    try {
      const newSharedState = !item.is_shared;
      
      if (type === 'file') {
        await toggleFileSharing.mutateAsync({
          fileId: item.id,
          isShared: newSharedState
        });
      } else {
        await toggleFolderSharing.mutateAsync({
          folderId: item.id,
          isShared: newSharedState
        });
      }

      showSuccess(
        newSharedState ? 'Shared Successfully' : 'Sharing Disabled',
        `${itemName} is now ${newSharedState ? 'shared with everyone' : 'private'}`
      );
    } catch (error) {
      console.error('Error toggling sharing:', error);
      showError('Error', 'Failed to update sharing settings');
    }
  };

  if (!isOwner && !item.is_shared) {
    // No mostrar botón si no es owner y no está compartido
    return null;
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleToggleSharing();
      }}
      disabled={toggleFileSharing.isPending || toggleFolderSharing.isPending}
      className={`p-1.5 rounded-md transition-all duration-200 ${
        item.is_shared
          ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
      } ${!isOwner ? 'cursor-default' : 'hover:scale-105'}`}
      title={
        !isOwner
          ? `Shared by another user`
          : item.is_shared
          ? 'Click to make private'
          : 'Click to share with everyone'
      }
    >
      {item.is_shared ? (
        <Users className="h-4 w-4" />
      ) : (
        <Lock className="h-4 w-4" />
      )}
    </button>
  );
};
