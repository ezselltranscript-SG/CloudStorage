import React from 'react';

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export interface DialogContentProps {
  children?: React.ReactNode;
  className?: string;
}

export interface DialogHeaderProps {
  children?: React.ReactNode;
  className?: string;
}

export interface DialogFooterProps {
  children?: React.ReactNode;
  className?: string;
}

export interface DialogTitleProps {
  children?: React.ReactNode;
  className?: string;
}

export interface DialogDescriptionProps {
  children?: React.ReactNode;
  className?: string;
}

export declare const Dialog: React.FC<DialogProps>;
export declare const DialogContent: React.FC<DialogContentProps>;
export declare const DialogHeader: React.FC<DialogHeaderProps>;
export declare const DialogFooter: React.FC<DialogFooterProps>;
export declare const DialogTitle: React.FC<DialogTitleProps>;
export declare const DialogDescription: React.FC<DialogDescriptionProps>;
export declare const DialogTrigger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>;
export declare const DialogClose: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>>;
