import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

export const UserProfile: React.FC = () => {
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-700">{user.email}</span>
      </div>
      <Button
        onClick={handleSignOut}
        variant="outline"
        size="sm"
        disabled={loading}
      >
        {loading ? 'Signing out...' : 'Sign out'}
      </Button>
    </div>
  );
};
