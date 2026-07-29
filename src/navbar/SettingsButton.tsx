import { Settings } from 'lucide-react';
import { useChangelog } from '@/hooks/useChangelog';
import { useNavigation } from '@/navbar/NavigationContext';

const SettingsButton = () => {
  const { hasNewChanges } = useChangelog();
  const { navigateTo } = useNavigation();

  return (
    <button
      onClick={() => navigateTo('settings')}
      className="p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-110 active:scale-95 relative antialiased"
      title="Settings"
    >
      <Settings className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6" />
      {hasNewChanges && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--accent-primary)] border-2 border-[var(--bg-primary)] z-10"></span>
      )}
    </button>
  );
};

export default SettingsButton; 