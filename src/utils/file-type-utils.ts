/**
 * Maps MIME types to user-friendly display names
 */
export const getFileTypeDisplayName = (mimetype: string): string => {
  const mimeTypeMap: Record<string, string> = {
    // Microsoft Office Documents
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint Presentation',
    'application/msword': 'Word Document',
    'application/vnd.ms-excel': 'Excel Spreadsheet',
    'application/vnd.ms-powerpoint': 'PowerPoint Presentation',
    
    // Google Docs formats
    'application/vnd.google-apps.document': 'Google Document',
    'application/vnd.google-apps.spreadsheet': 'Google Spreadsheet',
    'application/vnd.google-apps.presentation': 'Google Presentation',
    
    // Other long MIME types
    'application/vnd.oasis.opendocument.text': 'OpenDocument Text',
    'application/vnd.oasis.opendocument.spreadsheet': 'OpenDocument Spreadsheet',
    'application/vnd.oasis.opendocument.presentation': 'OpenDocument Presentation',
  };

  // Return mapped name if exists, otherwise return original mimetype
  return mimeTypeMap[mimetype] || mimetype;
};
