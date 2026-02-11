import { createContext, useContext, useState, ReactNode } from 'react';

interface RecurringTasksContextType {
  showRecurring: boolean;
  setShowRecurring: (show: boolean) => void;
}

const RecurringTasksContext = createContext<RecurringTasksContextType | undefined>(undefined);

export const useRecurringTasks = () => {
  const context = useContext(RecurringTasksContext);
  if (!context) {
    throw new Error('useRecurringTasks must be used within a RecurringTasksProvider');
  }
  return context;
};

interface RecurringTasksProviderProps {
  children: ReactNode;
}

export const RecurringTasksProvider: React.FC<RecurringTasksProviderProps> = ({ children }) => {
  const [showRecurring, setShowRecurring] = useState(true);

  return (
    <RecurringTasksContext.Provider value={{ showRecurring, setShowRecurring }}>
      {children}
    </RecurringTasksContext.Provider>
  );
};
