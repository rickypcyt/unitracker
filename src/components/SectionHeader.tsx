import type { ReactNode } from 'react';

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
}

const SectionHeader = ({ icon, title, subtitle }: SectionHeaderProps) => {
  return (
    <div className="flex items-center justify-center gap-3 mb-4 text-center">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex-shrink-0">
        {icon}
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-[var(--text-primary)] leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default SectionHeader;
