import React from 'react';
import type { File } from '../../services/supabase/file-service';

export interface RenameFileModalProps {
  isOpen: boolean;
  file: File;
  onClose: () => void;
}

export declare const RenameFileModal: React.FC<RenameFileModalProps>;
