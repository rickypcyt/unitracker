import React from "react";

export default function SectionTitle({ icon: Icon, children, className = "" }) {
  return (
    <div className={`section-title flex items-center gap-2 justify-center mb-4 ${className}`}>
      {Icon && <Icon size={24} className="icon" style={{ color: 'var(--accent-primary)' }} />}
      <span className="font-bold text-lg sm:text-xl text-[var(--text-primary)]">{children}</span>
    </div>
  );
} 