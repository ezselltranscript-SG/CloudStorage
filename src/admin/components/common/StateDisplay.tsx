import React from 'react';
import type { ReactNode } from 'react';
import { Loader2, AlertCircle, FileQuestion } from 'lucide-react';

interface StateDisplayProps {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  loadingMessage?: string;
  errorMessage?: string;
  emptyMessage?: string;
  children: ReactNode;
}

/**
 * Component that handles common UI states (loading, error, empty)
 * and displays appropriate messages and icons
 */
export const StateDisplay: React.FC<StateDisplayProps> = ({
  isLoading = false,
  isError = false,
  isEmpty = false,
  loadingMessage = 'Loading data...',
  errorMessage = 'An error occurred while loading data. Please try again.',
  emptyMessage = 'No data available.',
  children
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-slate-600 text-lg">{loadingMessage}</p>
      </div>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <p className="text-slate-800 text-lg font-medium mb-2">Error</p>
        <p className="text-slate-600 text-center max-w-md">{errorMessage}</p>
      </div>
    );
  }
  
  // Empty state
  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <FileQuestion className="h-8 w-8 text-slate-400" />
        </div>
        <p className="text-slate-800 text-lg font-medium mb-2">No Data</p>
        <p className="text-slate-600 text-center max-w-md">{emptyMessage}</p>
      </div>
    );
  }
  
  // Default: render children
  return <>{children}</>;
};
