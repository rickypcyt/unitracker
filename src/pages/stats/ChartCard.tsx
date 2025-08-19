import type { ReactNode } from 'react';

interface ChartCardProps {
  header?: ReactNode;
  children: ReactNode;
  paddingClass?: string; // e.g., "p-2"
  className?: string;
}

const ChartCard = ({ header, children, paddingClass = 'p-2', className = '' }: ChartCardProps) => {
  return (
    <div className="w-full">
      <div className={`maincard ${paddingClass} mb-1 ${className}`}>
        {header && (
          <div className="flex items-center justify-center gap-2 w-full mb-2 mt-1">
            {header}
          </div>
        )}
        <div className="w-full overflow-hidden">
          <div className="w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartCard;
