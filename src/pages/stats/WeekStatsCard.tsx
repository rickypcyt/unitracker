import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Dispatch, ReactElement, SetStateAction } from 'react';

import ChartCard from './ChartCard';
import StatsChart from './StatsChart';

const weekDayInitials = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type WeekDatum = { minutes: number; hoursLabel: string; date: string; dayName: string };
interface WeekStatsCardProps {
  data: WeekDatum[];
  accentColor: string;
  shownWeekNumber: number;
  weekOffset: number;
  setWeekOffset: Dispatch<SetStateAction<number>>;
  handleWeekPrevious?: () => void;
  handleWeekNext?: () => void;
  isDemo?: boolean;
}

const WeekStatsCard = ({ data, accentColor, shownWeekNumber, weekOffset, setWeekOffset, handleWeekPrevious, handleWeekNext, isDemo = false }: WeekStatsCardProps): ReactElement => {
  // Asegura que siempre haya 7 elementos, uno por cada día de la semana
  const weekData = weekDayInitials.map((label, idx) => {
    const d = data && data[idx] ? data[idx] : { minutes: 0, hoursLabel: '0:00', date: '', dayName: label };
    return {
      ...d,
      dayName: label,
    };
  });

  return (
    <div className="h-full flex flex-col">
      <ChartCard
        paddingClass="p-2"
        className="bg-[var(--bg-primary)]/90 border border-[var(--border-primary)] py-3 px-6 rounded-lg sticky top-4 z-50 backdrop-blur-sm"
        isDemo={isDemo}
        header={
          <>
            <button
              onClick={handleWeekPrevious || (() => setWeekOffset((prev) => prev + 1))}
              className="p-1 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="font-semibold text-lg text-center select-none transition-colors duration-200 text-[var(--accent-primary)]">
              {`Week ${shownWeekNumber}`}
            </span>
            <button
              onClick={handleWeekNext || (() => setWeekOffset((prev) => prev - 1))}
              className="p-1 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
              aria-label="Next week"
              disabled={weekOffset === 0}
            >
              <ChevronRight size={20} className={weekOffset === 0 ? 'opacity-40 cursor-not-allowed' : ''} />
            </button>
          </>
        }
      >
        <div className="flex-1">
          <StatsChart
            data={weekData}
            title={`Week ${shownWeekNumber}`}
            accentColor={accentColor}
            customTitle={<></>}
            xAxisTicks={weekDayInitials}
          />
        </div>
      </ChartCard>
    </div>
  );
};

export default WeekStatsCard; 