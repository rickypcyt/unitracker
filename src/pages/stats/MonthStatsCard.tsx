import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Dispatch, ReactElement, SetStateAction } from 'react';

import ChartCard from './ChartCard';
import StatsChart from './StatsChart';

type MonthDatum = { minutes: number; hoursLabel: string; date: string; dayName: string; realDay?: string };
interface MonthStatsCardProps {
  data: MonthDatum[];
  accentColor: string;
  shownMonthDate: Date;
  setMonthOffset: Dispatch<SetStateAction<number>>;
  monthOffset: number;
  handleMonthPrevious?: () => void;
  handleMonthNext?: () => void;
  isDemo?: boolean;
}

const MonthStatsCard = ({ data, accentColor, shownMonthDate, setMonthOffset, monthOffset, handleMonthPrevious, handleMonthNext, isDemo = false }: MonthStatsCardProps): ReactElement => (
  <ChartCard
    paddingClass="p-2"
className=""
    isDemo={isDemo}
    header={
      <>
        <button
          onClick={handleMonthPrevious || (() => setMonthOffset((prev) => prev - 1))}
          className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft size={20} />
        </button>
        <span
          className={`font-semibold text-lg text-center select-none transition-colors duration-200 ${monthOffset === 0 ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}
        >
          {shownMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={handleMonthNext || (() => setMonthOffset((prev) => prev + 1))}
          className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
          aria-label="Mes siguiente"
          disabled={monthOffset >= 0}
        >
          <ChevronRight size={20} className={monthOffset >= 0 ? 'opacity-40 cursor-not-allowed' : ''} />
        </button>
      </>
    }
  >
    <StatsChart
      data={data}
      title="This Month"
      accentColor={accentColor}
      customTitle={<></>}
    />
  </ChartCard>
);

export default MonthStatsCard; 