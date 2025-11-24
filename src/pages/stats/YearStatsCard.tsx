import ChartCard from './ChartCard';
import type { ReactElement } from 'react';
import StatsChart from './StatsChart';

type YearDatum = { minutes: number; hoursLabel: string; dayName: string; date: string };
interface YearStatsCardProps {
  data: YearDatum[];
  accentColor: string;
  isDemo?: boolean;
}

const YearStatsCard = ({ data, accentColor, isDemo = false }: YearStatsCardProps): ReactElement => (
  <ChartCard
    paddingClass="p-2"
    className="bg-[var(--bg-primary)]/90 border border-[var(--border-primary)] py-3 px-6 rounded-lg sticky top-4 z-50 backdrop-blur-sm"
    header={
      <span className="font-semibold text-lg text-center select-none transition-colors duration-200 text-[var(--accent-primary)]">This Year</span>
    }
    isDemo={isDemo}
  >
    <StatsChart
      data={data}
      title="This Year"
      accentColor={accentColor}
      customTitle={<></>}
    />
  </ChartCard>
);

export default YearStatsCard;