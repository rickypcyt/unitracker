import { isSameDay } from 'date-fns';

interface DayViewProps {
  selectedDate: Date;
  isLoggedIn: boolean;
  getTasksForDayAndHour: (day: Date, hour: number) => any[];
  setSelectedDate: (date: Date) => void;
  setShowTaskForm: (show: boolean) => void;
  setIsLoginPromptOpen: (open: boolean) => void;
}

const DayView = ({
  selectedDate,
  isLoggedIn,
  getTasksForDayAndHour,
  setSelectedDate,
  setShowTaskForm,
  setIsLoginPromptOpen,
}: DayViewProps) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const isCurrentDay = isSameDay(selectedDate, new Date());

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-primary)]/90 border-[var(--border-primary)] rounded-lg relative min-h-0 h-full">
      {/* Empty header for spacing consistency */}
      <div className="sticky top-0 z-20 h-1 bg-[var(--bg-primary)]/95 backdrop-blur-sm flex-shrink-0"></div>
      
      {/* Time grid */}
      <div className="flex-1 overflow-auto min-h-0">
        <div className="relative">
          {hours.map((hour) => {
            const isCurrentHour = isCurrentDay && hour === currentHour;
            const dayTasks = getTasksForDayAndHour(selectedDate, hour);

            return (
              <div key={hour} className="grid grid-cols-5 gap-1 border-t border-[var(--border-primary)]/30 relative">
                <div className="text-sm text-[var(--text-secondary)] p-1 text-left">
                  {format12Hour(hour)}
                </div>
                <div
                  className="col-span-4 border-l border-[var(--border-primary)]/20 hover:bg-[var(--bg-secondary)]/30 cursor-pointer p-1 min-h-[60px] transition-colors relative overflow-hidden"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const height = rect.height;
                    const minutes = Math.round((y / height) * 59);
                    const newDate = new Date(selectedDate);
                    newDate.setHours(hour, minutes, 0, 0);
                    setSelectedDate(newDate);
                    if (!isLoggedIn) return setIsLoginPromptOpen(true);
                    setShowTaskForm(true);
                  }}
                  title={`Click to set time at ${format12Hour(hour)}`}
                >
                  {isCurrentHour && (
                    <div
                      className="absolute left-0 right-0 h-0.5 border-t-2 border-[var(--accent-primary)] z-10 flex items-center"
                      style={{
                        top: `${(currentMinute / 60) * 60}px`,
                      }}
                    >
                      <div className="absolute left-0 text-xs text-[var(--accent-primary)] font-medium bg-[var(--bg-primary)] px-1">
                        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  )}
                  {dayTasks.length > 0 && (
                    <div className="absolute inset-0 flex flex-col gap-1 p-1 overflow-hidden z-5 pointer-events-none">
                      {dayTasks.map((task, taskIndex) => {
                        const occurrenceStart = task.occurrenceStart ? new Date(task.occurrenceStart) : new Date(task.deadline || selectedDate);
                        const occurrenceEnd = task.occurrenceEnd ? new Date(task.occurrenceEnd) : new Date(occurrenceStart.getTime() + 60 * 60 * 1000);
                        const taskMinute = occurrenceStart.getMinutes();
                        const topPosition = taskMinute > 0 ? (taskMinute / 60) * 60 : (taskIndex * 25);
                        const durationHours = (occurrenceEnd.getTime() - occurrenceStart.getTime()) / (60 * 60 * 1000);
                        const blockHeight = Math.max(28, Math.round(durationHours * 60) - 2);

                        return (
                          <div
                            key={task.id}
                            className="bg-[var(--accent-primary)]/85 text-white text-xs sm:text-sm px-1.5 pt-1 pb-0.5 rounded shadow-sm truncate pointer-events-auto cursor-pointer transition-all hover:shadow-md border border-[var(--accent-primary)]/30"
                            style={{
                              top: `${topPosition}px`,
                              minHeight: `${blockHeight}px`,
                              maxHeight: `${blockHeight}px`
                            }}
                            onClick={() => {
                              setSelectedDate(occurrenceStart);
                              setShowTaskForm(true);
                            }}
                            title={`${task.title}${task.assignment ? ` - ${task.assignment}` : ''} ${occurrenceStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${occurrenceEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                          >
                            <div className="font-medium truncate">{task.title}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Helper function for 12-hour formatting
const format12Hour = (hour: number) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
  return `${displayHour}:00 ${period}`;
};

export default DayView;