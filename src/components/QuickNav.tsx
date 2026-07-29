import { BookOpen, Calendar, CheckCircle2, Clock, Notebook, TrendingUp } from 'lucide-react';
import { useNavigation } from '@/navbar/NavigationContext';

const sections = [
  { id: 'page-session', label: 'Study', icon: Clock },
  { id: 'page-tasks', label: 'Tasks', icon: CheckCircle2 },
  { id: 'page-analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'page-habits', label: 'Journal', icon: Notebook },
  { id: 'page-notes', label: 'Notes', icon: BookOpen },
];

const QuickNav = () => {
  const { navigateTo } = useNavigation();

  const handleClick = (id: string, page: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    navigateTo(page as any);
  };

  return (
    <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/80 backdrop-blur-sm py-3 px-1">
      <div className="flex flex-wrap gap-2 justify-center">
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleClick(id, id.replace('page-', ''))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-all duration-200"
          >
            <Icon size={14} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickNav;
