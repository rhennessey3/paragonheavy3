import React, { useEffect, useRef } from 'react';

interface DialogProps {
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
    if (!open) return null;

    const handleClose = () => {
        onOpenChange && onOpenChange(false);
    };

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background rounded-lg shadow-lg w-full max-w-lg mx-4 p-6 relative animate-in fade-in zoom-in duration-200">
                {children}
                <button
                    onClick={handleClose}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                >
                    <span className="sr-only">Close</span>
                </button>
            </div>
        </div>
    );
}

export function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={className ?? 'space-y-4'}>{children}</div>;
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
    return <div className="border-b pb-2 mb-4">{children}</div>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
    return <h2 className="text-lg font-semibold">{children}</h2>;
}

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={className ?? 'flex justify-end space-x-2 mt-4'}>{children}</div>;
}

export function DialogClose({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
    // asChild allows wrapping a custom button; we just render children with onClick
    const handleClick = (e: React.MouseEvent) => {
        const dialog = (e.currentTarget as HTMLElement).closest('dialog');
        if (dialog) {
            dialog.close();
        }
    };
    if (asChild) {
        return React.cloneElement(React.Children.only(children) as React.ReactElement<any>, { onClick: handleClick });
    }
    return (
        <button type="button" onClick={handleClick} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300">
            {children}
        </button>
    );
}
