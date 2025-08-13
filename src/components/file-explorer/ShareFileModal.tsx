import React, { useState, useRef } from 'react';
import { X, Copy, Link, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { useFilePublicUrl } from '../../hooks/useFiles';
import { useToast } from '../../hooks/useToast';
import type { File as FileType } from '../../services/supabase/file-service';

interface ShareFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: FileType | null;
}

export const ShareFileModal: React.FC<ShareFileModalProps> = ({
  isOpen,
  onClose,
  file
}) => {
  const [copied, setCopied] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const { publicUrl } = useFilePublicUrl(file?.storage_path || null);
  const { showSuccess, showError } = useToast();

  if (!isOpen || !file || !publicUrl) return null;

  const handleCopyLink = () => {
    if (linkInputRef.current) {
      linkInputRef.current.select();
      try {
        document.execCommand('copy');
        // Modern alternative for browsers that support the Clipboard API
        navigator.clipboard.writeText(publicUrl)
          .then(() => {
            setCopied(true);
            showSuccess('Link copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
          })
          .catch(() => {
            showError('Error', 'Could not copy the link');
          });
      } catch (err) {
        showError('Error', 'Could not copy the link');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Link className="mr-2 h-5 w-5 text-blue-600" />
            Share File
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-2">
            Public link for <strong>{file.filename}</strong>:
          </p>
          
          <div className="flex items-center mt-3">
            <input
              ref={linkInputRef}
              type="text"
              value={publicUrl}
              readOnly
              className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCopyLink}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-r-md flex items-center"
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
          
          <p className="text-sm text-gray-500 mt-2">
            Anyone with this link will be able to access the file.
          </p>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShareFileModal;
