import type { CSSProperties } from 'react';

import type { ColumnCount } from '@/modals/tasks/TaskPageSettingsModal';

/** Task rows per ghost column: uneven on purpose, like a real board. */
const GHOST_COLUMNS = [3, 2, 4, 2];
const TITLE_WIDTHS = ['w-4/5', 'w-3/5', 'w-2/3', 'w-1/2'];

const COLUMNS_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4',
};

const order = (index: number) => ({ '--i': index }) as CSSProperties;

/** Placeholder shaped like the board, shown while the first tasks arrive. */
export const TasksSkeleton = ({ columnCount = 1 }: { columnCount?: ColumnCount }) => (
  <div role="status" data-tour="tasks-board" className={`grid w-full items-start gap-3 ${COLUMNS_CLASS[columnCount]}`}>
    <span className="sr-only">Loading tasks...</span>
    {GHOST_COLUMNS.slice(0, columnCount).map((rows, column) => (
      <div
        key={column}
        aria-hidden
        style={order(column)}
        className="skeleton-column rounded-2xl border border-(--border-primary) bg-(--bg-secondary)/40 p-2.5"
      >
        <div className="skeleton-bar mb-3 h-4 w-1/3 rounded-full" />
        <div className="space-y-1.5">
          {Array.from({ length: rows }, (_, row) => (
            <div key={row} className="flex items-center gap-2.5 rounded-lg border border-(--border-primary) p-3">
              <div className="skeleton-bar h-4 w-4 shrink-0 rounded-full" />
              <div className={`skeleton-bar h-3 rounded-full ${TITLE_WIDTHS[(column + row) % TITLE_WIDTHS.length]}`} />
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);
