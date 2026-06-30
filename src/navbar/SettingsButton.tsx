import { Settings } from 'lucide-react';
import SettingsModal from '@/modals/Settings';
import { useChangelog } from '@/hooks/useChangelog';
import { useState } from 'react';

const SettingsButton = ({
  friends = [],
  workspaces = [],
  onRemoveFriend,
}: {
  friends?: any[];
  workspaces?: any[];
  onRemoveFriend?: (friend: { id: string; username?: string | null; email?: string | null }) => Promise<void>;
}) => {
  const { hasNewChanges } = useChangelog();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowSettingsModal(true)}
        className="p-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-all duration-200 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-110 active:scale-95 relative antialiased"
        title="Settings"
      >
        <Settings className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6" />
        {hasNewChanges && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--accent-primary)] border border-[var(--bg-primary)] z-10"></span>
        )}
      </button>
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        friends={friends}
        workspaces={workspaces}
        {...(onRemoveFriend && { onRemoveFriend })}
      />
    </>
  );
};

export default SettingsButton; 