// utils/componentRegistry.ts
import TaskForm from "../components/tools/TaskForm";
import TaskList from "../components/tools/TaskList";
import ProgressTracker from "../components/tools/ProgressTracker";
import Calendar from "../components/tools/Calendar";
import StudyTimer from "../components/tools/StudyTimer";
import NoiseGenerator from "../components/tools/NoiseGenerator";
import Statistics from "../components/tools/Stats";
import Pomodoro from "../components/tools/Pomodoro";
import StartSessionMenu from "../components/StartSessionMenu";

interface ComponentConfig {
  component: (props?: any) => JSX.Element;
  name: string;
  isWide: boolean;
}

export const ComponentRegistry: Record<string, ComponentConfig> = {
  TaskForm: { component: TaskForm, name: "Task Form", isWide: false },
  TaskList: { component: TaskList, name: "Task List", isWide: false },
  ProgressTracker: {
    component: ProgressTracker,
    name: "Progress Tracker",
    isWide: false,
  },
  Calendar: { component: Calendar, name: "Calendar", isWide: false },
  StudyTimer: { component: StudyTimer, name: "StudyTimer", isWide: false },
  NoiseGenerator: {
    component: NoiseGenerator,
    name: "NoiseGenerator",
    isWide: false,
  },
  Statistics: { component: Statistics, name: "Statistics", isWide: false },
  Pomodoro: { component: Pomodoro, name: "Pomodoro", isWide: false },
};
