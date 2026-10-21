import { useState } from 'react';
import { BarChart3, Notebook } from 'lucide-react';
import QuickStats from '@/pages/session/QuickStats';
import StatsPage from '@/pages/stats/StatsPage';
import HabitsPage from '@/pages/habits/HabitsPage';

const AnalyticsJournal = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'journal'>('analytics');

  return (
    <div className="flex flex-col gap-4">
      {/* Quick Stats always visible */}
      <QuickStats />

      {/* Tab buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'analytics'
              ? 'bg-[var(--accent-primary)] text-white'
              : 'border-2 border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/30'
          }`}
        >
          <BarChart3 size={16} />
          <span>Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab('journal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'journal'
              ? 'bg-[var(--accent-primary)] text-white'
              : 'border-2 border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]/30'
          }`}
        >
          <Notebook size={16} />
          <span>Journal</span>
        </button>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'analytics' ? <StatsPage /> : <HabitsPage />}
      </div>
    </div>
  );
};

export default AnalyticsJournal;
