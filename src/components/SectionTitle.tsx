import React, { useState } from 'react';

/**
 * SectionTitle - Componente reutilizable para títulos de sección con tooltip informativo
 * 
 * @example
 * // Título simple con tooltip
 * <SectionTitle 
 *   title="Study Timer" 
 *   tooltip="A customizable timer for focused study sessions"
 * />
 * 
 * // Título con tamaño personalizado
 * <SectionTitle 
 *   title="Pomodoro" 
 *   tooltip="Time management technique with work/break cycles"
 *   size="lg"
 * />
 * 
 * // Título con clases CSS adicionales
 * <SectionTitle 
 *   title="Countdown" 
 *   tooltip="Timer that counts down from a set time"
 *   className="text-center mb-6"
 * />
 */
interface SectionTitleProps {
  title: string;
  tooltip: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SectionTitle: React.FC<SectionTitleProps> = ({ 
  title, 
  tooltip, 
  className = '', 
  size = 'md' 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const sizeClasses = {
    sm: 'text-lg font-semibold',
    md: 'text-xl font-bold',
    lg: 'text-2xl font-bold'
  };

  return (
    <div className="relative inline-block">
      <div 
        className="group cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <h2 className={`${sizeClasses[size]} text-[var(--text-primary)] ${className}`}>
          {title}
        </h2>
        
        {/* Tooltip hacia abajo */}
        {showTooltip && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-50">
            <div className="bg-[var(--bg-primary)] border-2 border-[var(--accent-primary)] rounded-lg p-3 shadow-xl w-[320px]">
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                {tooltip}
              </p>
              {/* Arrow hacia arriba */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-[var(--accent-primary)]"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SectionTitle; 