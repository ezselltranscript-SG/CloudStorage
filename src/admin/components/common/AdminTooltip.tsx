import React from 'react';
import type { ReactNode } from 'react';
import { useState } from 'react';

interface AdminTooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
  maxWidth?: string;
}

/**
 * Tooltip component for admin dashboard
 * 
 * @example
 * <AdminTooltip content="This action cannot be undone">
 *   <button>Delete</button>
 * </AdminTooltip>
 */
export const AdminTooltip: React.FC<AdminTooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300,
  maxWidth = '200px'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  // Position styles for the tooltip
  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 mb-1';
      case 'right':
        return 'left-full top-1/2 transform translate-x-2 -translate-y-1/2 ml-1';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 translate-y-2 mt-1';
      case 'left':
        return 'right-full top-1/2 transform -translate-x-2 -translate-y-1/2 mr-1';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 mb-1';
    }
  };
  
  // Arrow position styles
  const getArrowStyles = () => {
    switch (position) {
      case 'top':
        return 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full border-t-slate-800 border-l-transparent border-r-transparent border-b-0';
      case 'right':
        return 'left-0 top-1/2 transform -translate-x-full -translate-y-1/2 border-r-slate-800 border-t-transparent border-b-transparent border-l-0';
      case 'bottom':
        return 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-full border-b-slate-800 border-l-transparent border-r-transparent border-t-0';
      case 'left':
        return 'right-0 top-1/2 transform translate-x-full -translate-y-1/2 border-l-slate-800 border-t-transparent border-b-transparent border-r-0';
      default:
        return 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full border-t-slate-800 border-l-transparent border-r-transparent border-b-0';
    }
  };
  
  // Show tooltip with delay
  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };
  
  // Hide tooltip and clear timeout
  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };
  
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div 
          className={`absolute z-50 ${getPositionStyles()}`}
          style={{ maxWidth }}
          role="tooltip"
        >
          <div className="bg-slate-800 text-white text-xs rounded py-1 px-2 whitespace-normal">
            {content}
            <div 
              className={`absolute w-0 h-0 border-4 ${getArrowStyles()}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};
