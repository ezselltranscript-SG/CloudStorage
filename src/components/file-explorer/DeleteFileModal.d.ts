import React from 'react';
import type { File } from '../../services/supabase/file-service';

export interface DeleteFileModalProps {
  isOpen: boolean;
  file: File;
  onClose: () => void;
}

export declare const DeleteFileModal: React.FC<DeleteFileModalProps>;
