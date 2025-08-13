import { FC } from 'react';
import { ReactNode } from 'react';

export interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  requirePermission?: string;
}

export const AdminLayout: FC<AdminLayoutProps>;
