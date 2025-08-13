import { FC } from 'react';
import { AdminUser } from '../../types/auth';

export interface AdminTopbarProps {
  title: string;
  onMenuClick: () => void;
  user: AdminUser;
}

export const AdminTopbar: FC<AdminTopbarProps>;
