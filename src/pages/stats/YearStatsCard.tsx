import StatsChart from './StatsChart';
import ChartCard from './ChartCard';
import type { ReactElement } from 'react';

type YearDatum = { minutes: number; hoursLabel: string; dayName: string; date: string };
interface YearStatsCardProps {
  data: YearDatum[];
  accentColor: string;
}

const YearStatsCard = ({ data, accentColor }: YearStatsCardProps): ReactElement => (
  <ChartCard
    paddingClass="p-2"
    header={
      <span className="font-semibold text-lg text-center select-none transition-colors duration-200 text-[var(--accent-primary)]">This Year</span>
    }
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