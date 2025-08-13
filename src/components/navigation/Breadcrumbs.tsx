import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  onNavigate: (itemId: string | null) => void;
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  onNavigate,
  className
}) => {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center text-sm text-gray-600 overflow-x-auto py-2", className)}>
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center hover:text-blue-600 hover:underline"
        title="Home"
      >
        <Home className="h-4 w-4 mr-1" />
        <span>Home</span>
      </button>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
          <button
            onClick={() => onNavigate(item.id)}
            className={cn(
              "hover:text-blue-600 hover:underline truncate max-w-[150px]",
              index === items.length - 1 ? "font-medium text-blue-600" : ""
            )}
            title={item.name}
          >
            {item.name}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};
