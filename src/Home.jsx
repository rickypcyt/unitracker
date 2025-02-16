import React from 'react';
import TaskForm from './redux/TaskForm';
import TaskList from './redux/TaskList';
import ProgressTracker from './components/ProgressTracker';
import Achievements from './components/Achievements';
import Calendar from './components/Calendar';
import Counter from './components/Counter'

const Home = () => {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <TaskForm />
          <TaskList />
        </div>
        
        <div className="lg:col-span-1 space-y-4">
          <ProgressTracker />
          <Achievements />
          <Counter />
        </div>

        <div className="lg:col-span-3">
          <Calendar />
        </div>
      </div>
    </div>
  );
};

export default Home;
