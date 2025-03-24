// utils/componentRegistry.ts
import TaskForm from '../redux/TaskForm';
import TaskList from '../redux/TaskList';
import ProgressTracker from '../components/ProgressTracker';
import Calendar from '../components/Calendar';
import StudyTimer from '../components/StudyTimer';
import NoiseGenerator from '../components/NoiseGenerator';
import Statistics from '../components/Stats';
import Pomodoro from '../components/Pomodoro';

export const ComponentRegistry = {
  TaskForm: { component: TaskForm, name: 'Task Form', isWide: false },
  TaskList: { component: TaskList, name: 'Task List', isWide: false },
  ProgressTracker: { component: ProgressTracker, name: 'Progress Tracker', isWide: false },
  Calendar: { component: Calendar, name: 'Calendar', isWide: false },
  StudyTimer: { component: StudyTimer, name: 'StudyTimer', isWide: false },
  NoiseGenerator: { component: NoiseGenerator, name: 'NoiseGenerator', isWide: false },
  Statistics: { component: Statistics, name: 'Statistics', isWide: false },
  Pomodoro: { component: Pomodoro, name: 'Pomodoro', isWide: false }
};