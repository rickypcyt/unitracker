interface ComponentLabelProps {
  label: string;
}

const ComponentLabel = ({ label }: ComponentLabelProps) => {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="h-px flex-1 bg-[var(--border-primary)]" />
      <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        {label}
      </span>
      <div className="h-px flex-1 bg-[var(--border-primary)]" />
    </div>
  );
};

export default ComponentLabel;
