import React, { memo, useEffect } from 'react';
import Statistics from '../../components/tools/Stats';
import { useLocation } from 'react-router-dom';

const StatsPage = memo(() => {
  const location = useLocation();
  const isVisible = location.pathname === '/stats';

  // Actualizar estadísticas cuando la página se hace visible
  useEffect(() => {
    if (isVisible) {
      window.dispatchEvent(new CustomEvent('refreshStats'));
    }
  }, [isVisible]);

  return (
    <div className="container mx-auto px-4 pt-20">
      <div className="max-w-4xl mx-auto">
        <Statistics />
      </div>
    </div>
  );
});

StatsPage.displayName = 'StatsPage';

export default StatsPage; 