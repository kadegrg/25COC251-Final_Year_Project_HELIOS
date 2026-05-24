import type { ReactNode } from 'react';

interface ToolbarProps {
  children: ReactNode;
}

export function Toolbar({ children }: ToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {children}
    </div>
  );
}

