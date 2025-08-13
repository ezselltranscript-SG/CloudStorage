import { FC } from 'react';

export interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const AdminSidebar: FC<AdminSidebarProps>;
