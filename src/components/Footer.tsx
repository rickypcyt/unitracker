import { Save, Trash2 } from 'lucide-react';

import React from 'react';

interface FooterProps {
  onSave?: () => void;
  onDelete?: () => void;
  onBackToNotes?: () => void;
  showActions?: boolean;
}

const Footer: React.FC<FooterProps> = ({ onSave, onDelete, onBackToNotes, showActions = false }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-[var(--border-primary)] bg-[var(--bg-primary)] px-4 py-3 z-20">
      <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToNotes}
            className="text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors"
            title="Back to notes list"
          >
            ← Back to Notes
          </button>
        </div>
        <div className="flex items-center gap-2">
          {showActions && (
            <>
              <button
                onClick={onDelete}
                className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Delete note"
              >
                <Trash2 size={20} />
              </button>
              <button
                onClick={onSave}
                className="p-2 text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80 hover:bg-[var(--accent-primary)]/10 rounded-lg transition-colors"
                title="Save note"
              >
                <Save size={20} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Footer;