import React, { ReactNode } from 'react';

interface EmptyStateProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  message: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  secondaryLabel?: string;
  onSecondaryClick?: () => void;
  children?: ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  message,
  ctaLabel,
  onCtaClick,
  secondaryLabel,
  onSecondaryClick,
  children,
}) => {
  return (
    <div className="flex items-center justify-center py-12 min-h-[40vh]">
      <div className="text-center max-w-sm px-4">
        <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-(--accent-primary)/10 flex items-center justify-center">
          <Icon size={32} className="text-(--accent-primary)" />
        </div>
        <h3 className="text-xl font-bold text-(--text-primary) mb-2">
          {title}
        </h3>
        <p className="text-sm text-(--text-secondary) mb-6 leading-relaxed">
          {message}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {ctaLabel && onCtaClick && (
            <button
              onClick={onCtaClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-all w-full sm:w-auto border-2 border-(--accent-primary) text-(--accent-primary) hover:bg-(--accent-primary)/10"
            >
              {ctaLabel}
            </button>
          )}
          {secondaryLabel && onSecondaryClick && (
            <button
              onClick={onSecondaryClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-(--border-primary) text-(--text-secondary) text-sm font-medium hover:bg-(--bg-secondary) transition-all w-full sm:w-auto"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};

export default EmptyState;
