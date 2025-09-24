import type { ReactNode } from 'react';

interface ChartCardProps {
  header?: ReactNode;
  children: ReactNode;
  paddingClass?: string; // e.g., "p-2"
  className?: string;
}

const ChartCard = ({ header, children, paddingClass = 'p-2', className = '' }: ChartCardProps) => {
  return (
    <div className="w-full h-full flex flex-col">
      <div className={`maincard ${paddingClass} mb-1 flex-1 flex flex-col ${className}`}>
        {header && (
          <div className="flex items-center justify-center gap-2 w-full mb-2 mt-1 flex-shrink-0">
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
