import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';

const DayTooltip = ({ date, tasks, studiedHours }) => {
  const totalTasks = tasks?.length || 0;

  return (
    <div className="absolute z-50 bg-neutral-900 border border-neutral-800 rounded-lg p-3 shadow-lg min-w-[200px] transform -translate-y-full -translate-x-1/2 left-1/2 -top-2">
      <div className="text-base font-medium text-white mb-2">
        {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-neutral-300">
          <CheckCircle2 size={16} className="text-green-500" />
          <span>{totalTasks} tasks</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-300">
          <Clock size={16} className="text-blue-500" />
          <span>{studiedHours || 0} hours studied</span>
        </div>
      </div>
      {/* Arrow */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
        <div className="border-8 border-transparent border-t-neutral-900"></div>
      </div>
    </div>
  );
};

export default DayTooltip; 