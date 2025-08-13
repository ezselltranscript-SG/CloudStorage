export interface AdminFile {
  id: string;
  filename: string;
  name: string;
  size: number;
  type: string;
  mimetype: string;
  folder_id: string | null;
  folderId: string | null;
  storage_path: string;
  url: string;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userEmail: string;
  isDeleted: boolean;
  deletedAt: string | null;
}

export interface AdminFolder {
  id: string;
  name: string;
  parent_id: string | null;
  parentId: string | null;
  path: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  userEmail: string;
  isDeleted: boolean;
  deletedAt: string | null;
}

export interface AdminFileFilters {
  userId?: string;
  folderId?: string;
  query?: string;
  includeDeleted: boolean;
  sortBy: 'name' | 'size' | 'createdAt' | 'updatedAt';
  sortDirection: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface AdminFolderFilters {
  userId?: string;
  parentId?: string;
  query?: string;
  includeDeleted: boolean;
  sortBy: 'name' | 'createdAt' | 'updatedAt';
  sortDirection: 'asc' | 'desc';
  page: number;
  pageSize: number;
}
