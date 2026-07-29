import React from 'react';

interface TimeSegment {
  value: string;
  label: string;
  colorClass?: string;
}

interface TimeSegmentDisplayProps {
  segments: TimeSegment[];
  separatorColor?: string;
  className?: string;
}

const TimeSegmentDisplay: React.FC<TimeSegmentDisplayProps> = ({
  segments,
  separatorColor = 'text-[var(--text-secondary)]',
  className = ''
}) => {
  return (
    <div className={`flex items-start justify-center gap-1.5 ${className}`}>
      {segments.map((segment, i) => (
        <React.Fragment key={segment.label}>
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 rounded-lg bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)]">
              <span className={`text-2xl sm:text-3xl md:text-4xl font-mono font-bold tabular-nums tracking-tight leading-none ${segment.colorClass || 'text-[var(--text-primary)]'}`}>
                {segment.value}
              </span>
            </div>
            <span className="text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mt-1">
              {segment.label}
            </span>
          </div>
          {i < segments.length - 1 && (
            <span className={`text-2xl sm:text-3xl md:text-4xl font-mono font-bold leading-none mt-2 ${separatorColor}`}>
              :
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default TimeSegmentDisplay;
