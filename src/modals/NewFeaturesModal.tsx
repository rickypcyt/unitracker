import BaseModal from './BaseModal';

interface NewFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChangelogEntry {
  version: string;
  date: string;
  time: string;
  type: 'major' | 'minor' | 'patch';
  changes: {
    added?: string[];
    improved?: string[];
    fixed?: string[];
    removed?: string[];
    soon?: string[];
  };
}

const NewFeaturesModal = ({ isOpen, onClose }: NewFeaturesModalProps) => {
  const changelog: ChangelogEntry[] = [
    {
      version: "1.1.2",
      date: "December 21, 2025",
      time: "5:17 PM",
      type: "patch",
      changes: {
        fixed: [
          "Fixed Pomodoro timer synchronization issues"
        ],
        improved: [
          "New workspace switching mode with sideways scroll",
          "Share workspace with friends feature is now fully functional",
          "Task status system for better task organization"
        ],
        soon: [
          "Timeblocks page - Assign time blocks to tasks",
          "Leaderboard system - Compete with friends"
        ]
      }
    },
    {
      version: "1.1.1",
      date: "December 21, 2025",
      time: "5:00 PM",
      type: "patch",
      changes: {
        added: [
          "Hello world!",
          "First use of the Uni Tracker changelog system"
        ],
        improved: [
          "Here you will see the upcoming changes and improvements we will be implementing in the application"
        ],
        fixed: [],
        removed: []
      }
    }
  ];

  
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Release Notes"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        
        {/* Changelog Entries */}
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {changelog.map((entry, index) => (
            <div key={index} className="border border-[var(--border-primary)] rounded-lg p-5 bg-[var(--bg-secondary)]/30">
              {/* Version Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h4 className="text-lg font-semibold text-[var(--text-primary)]">
                    {entry.date}
                  </h4>
                </div>
                <span className="text-sm text-gray-500">
                  {entry.time}
                </span>
              </div>

              {/* Changes */}
              <div className="space-y-3">
                {entry.changes.added && entry.changes.added.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full"></span>
                      Added
                    </h5>
                    <ul className="space-y-1 ml-0">
                      {entry.changes.added.map((change, i) => (
                        <li key={i} className="text-sm text-[var(--text-secondary)]">
                          - {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {entry.changes.improved && entry.changes.improved.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></span>
                      Improved
                    </h5>
                    <ul className="space-y-1 ml-0">
                      {entry.changes.improved.map((change, i) => (
                        <li key={i} className="text-sm text-[var(--text-secondary)]">
                          - {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {entry.changes.fixed && entry.changes.fixed.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-600 dark:bg-orange-400 rounded-full"></span>
                      Fixed
                    </h5>
                    <ul className="space-y-1 ml-0">
                      {entry.changes.fixed.map((change, i) => (
                        <li key={i} className="text-sm text-[var(--text-secondary)]">
                          - {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {entry.changes.soon && entry.changes.soon.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full"></span>
                      Coming Soon
                    </h5>
                    <ul className="space-y-1 ml-0">
                      {entry.changes.soon.map((change, i) => (
                        <li key={i} className="text-sm text-[var(--text-secondary)]">
                          - {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {entry.changes.removed && entry.changes.removed.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full"></span>
                      Removed
                    </h5>
                    <ul className="space-y-1 ml-0">
                      {entry.changes.removed.map((change, i) => (
                        <li key={i} className="text-sm text-[var(--text-secondary)] line-through">
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border-primary)] pt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              For detailed technical documentation, visit our GitHub repository.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => window.open('https://github.com/rickypcyt/unitracker', '_blank')}
                className="px-4 py-2 text-sm font-medium text-[var(--text-primary)] border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
              >
                View on GitHub
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 text-base font-medium text-[var(--accent-primary)] border-2 border-[var(--accent-primary)] rounded-lg hover:bg-[var(--accent-primary)]/10 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default NewFeaturesModal;
