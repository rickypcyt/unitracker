import React from 'react';
import TaskForm from './redux/TaskForm';
import TaskList from './redux/TaskList';
import ProgressTracker from './components/ProgressTracker';
import Achievements from './components/Achievements';
import Calendar from './components/Calendar';

const Home = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-text-primary mb-8 text-center">Task Manager</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <div>
          <ProgressTracker />
        </div>
        
        <div>
          <Achievements />
        </div>

        <div className="md:col-span-2">
          <TaskForm />
        </div>
        
        <div className="md:col-span-2">
          <TaskList />
        </div>
        
        <div className="md:col-span-2">
          <Calendar />
        </div>
      </div>
    </div>
  );
};

export default Home;
