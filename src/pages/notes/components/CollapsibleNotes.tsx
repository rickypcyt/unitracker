import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Notes from '@/pages/notes/Notes';
import { useTranslation } from 'react-i18next';

const CollapsibleNotes = () => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className={expanded ? '' : 'max-h-[400px] overflow-hidden relative'}>
        <Notes />
        {!expanded && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--bg-primary)] to-transparent pointer-events-none" />
        )}
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-center gap-2 py-2 text-sm text-[var(--accent-primary)] hover:underline"
      >
        {expanded ? (
          <>
            <ChevronUp size={16} />
            <span>{t('notes.showLess')}</span>
          </>
        ) : (
          <>
            <ChevronDown size={16} />
            <span>{t('notes.showAllNotes')}</span>
          </>
        )}
      </button>
    </div>
  );
};

export default CollapsibleNotes;
