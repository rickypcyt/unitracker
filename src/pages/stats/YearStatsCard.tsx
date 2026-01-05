import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Dispatch, ReactElement, SetStateAction } from 'react';

import ChartCard from './ChartCard';
import StatsChart from './StatsChart';

type YearDatum = { minutes: number; hoursLabel: string; dayName: string; date: string };
interface YearStatsCardProps {
  data: YearDatum[];
  accentColor: string;
  shownYear: number;
  yearOffset: number;
  setYearOffset: Dispatch<SetStateAction<number>>;
  handleYearPrevious?: () => void;
  handleYearNext?: () => void;
  isDemo?: boolean;
}

const YearStatsCard = ({ 
  data, 
  accentColor, 
  shownYear, 
  yearOffset, 
  setYearOffset, 
  handleYearPrevious, 
  handleYearNext, 
  isDemo = false 
}: YearStatsCardProps): ReactElement => (
  <ChartCard
    paddingClass="p-2"
    className="bg-[var(--bg-primary)]/90 border border-[var(--border-primary)] py-3 px-6 rounded-lg sticky top-4 z-50 backdrop-blur-sm"
    header={
      <>
        <button
          onClick={handleYearPrevious || (() => setYearOffset((prev) => prev + 1))}
          className="p-1 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
          aria-label="Año anterior"
        >
          <ChevronLeft size={20} />
        </button>
        <span
          className={`font-semibold text-lg text-center select-none transition-colors duration-200 ${yearOffset === 0 ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}
        >
          {shownYear}
        </span>
        <button
          onClick={handleYearNext || (() => setYearOffset((prev) => prev - 1))}
          className="p-1 rounded-full hover:bg-[var(--bg-hover)] transition-colors"
          aria-label="Año siguiente"
        >
          <ChevronRight size={20} />
        </button>
      </>
    }
    isDemo={isDemo}
  >
    <StatsChart
      data={data}
      title={`${shownYear}`}
      accentColor={accentColor}
      customTitle={<></>}
    />
  </ChartCard>
);

export default YearStatsCard;