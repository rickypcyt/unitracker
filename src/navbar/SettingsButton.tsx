import { Settings } from 'lucide-react';
import { useChangelog } from '@/hooks/useChangelog';
import { useNavigation } from '@/navbar/NavigationContext';

interface SettingsButtonProps {
  expanded?: boolean;
}

const SettingsButton = ({ expanded = false }: SettingsButtonProps) => {
  const { hasNewChanges } = useChangelog();
  const { openSettings } = useNavigation();

  return (
    <button
      onClick={() => openSettings()}
      className={`rounded-xl flex items-center transition-all duration-200 bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-[1.02] active:scale-95 relative antialiased ${
        expanded
          ? 'w-full h-12 px-3 flex-row gap-3 justify-start'
          : 'w-12 lg:w-16 h-12 lg:h-14 flex-col justify-center'
      }`}
      title="Settings"
    >
      <Settings className="w-5 h-5 lg:w-6 lg:h-6 flex-shrink-0" />
      <span className={`font-medium leading-none ${expanded ? 'block text-sm' : 'text-[9px] lg:text-[10px] mt-0.5'}`}>
        Settings
      </span>
      {hasNewChanges && (
        <span className={`absolute w-2 h-2 rounded-full bg-[var(--accent-primary)] border-2 border-[var(--bg-primary)] z-10 ${expanded ? 'right-2.5 top-1/2 -translate-y-1/2' : '-top-0.5 -right-0.5'}`}></span>
      )}
    </button>
  );
};

export default SettingsButton; 