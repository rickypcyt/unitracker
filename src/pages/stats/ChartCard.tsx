import type { ReactNode } from 'react';

interface ChartCardProps {
  header?: ReactNode;
  children: ReactNode;
  paddingClass?: string; // e.g., "p-2"
  className?: string;
  isDemo?: boolean;
}

const ChartCard = ({ header, children, paddingClass = 'p-0', className = '', isDemo = false }: ChartCardProps) => {
  return (
    <div className="w-full h-full flex flex-col">
      <div className={`${paddingClass} mb-1 flex-1 flex flex-col bg-[var(--bg-primary)] border border-[var(--border-primary)] py-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 px-4 ${className} ${isDemo ? 'ring-2 ring-blue-500/20' : ''}`}>
        {header && (
          <div className="flex items-center justify-between gap-2 w-full mb-3 flex-shrink-0">
            {header}
          </div>
        )}
        <div className="w-full overflow-hidden flex-1">
          <div className="w-full h-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartCard;
