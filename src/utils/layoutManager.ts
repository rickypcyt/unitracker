import TaskForm from "../components/tools/TaskForm";
import TaskList from "../components/tools/TaskList";
import ProgressTracker from "../components/tools/ProgressTracker";
import Calendar from "../components/tools/Calendar";
import StudyTimer from "../components/tools/StudyTimer";
import NoiseGenerator from "../components/tools/NoiseGenerator";
import Statistics from "../components/tools/Stats";
import Pomodoro from "../components/tools/Pomodoro";

interface LayoutColumn {
    id: string;
    items: string[];
}

export interface ComponentConfig {
    name: string;
    component: React.FC<any>;
  }
  
  export const ComponentRegistry: Record<string, ComponentConfig> = {
    TaskForm: { component: TaskForm, name: "Task Form" },
    TaskList: { component: TaskList, name: "Task List" },
    ProgressTracker: { component: ProgressTracker, name: "Progress Tracker" },
    Calendar: { component: Calendar, name: "Calendar" },
    StudyTimer: { component: StudyTimer, name: "Study Timer" },
    NoiseGenerator: { component: NoiseGenerator, name: "Noise Generator" },
    Statistics: { component: Statistics, name: "Statistics" },
    Pomodoro: { component: Pomodoro, name: "Pomodoro" },
  };

export const LayoutManager = {
    getInitialLayout: (): LayoutColumn[] => {
        const savedLayout = localStorage.getItem("layout");
        if (savedLayout) {
            return JSON.parse(savedLayout);
        }
        return [
            { id: "column-1", items: ["StudyTimer", "NoiseGenerator", "Calendar"] },
            { id: "column-2", items: ["Pomodoro", "TaskForm"] },
            { id: "column-3", items: ["TaskList", "Stats", "ProgressTracker"] },
        ];
    },

    saveLayout: (layout: LayoutColumn[]) => {
        localStorage.setItem("layout", JSON.stringify(layout));
    },

    updateLayoutAfterDrag: (
        layout: LayoutColumn[],
        result: any,
    ): LayoutColumn[] => {
        const { source, destination } = result;
        if (!destination) return layout;

        const newLayout = [...layout];
        const sourceColumn = newLayout.find((col) => col.id === source.droppableId);
        const destColumn = newLayout.find(
            (col) => col.id === destination.droppableId,
        );
        const [movedItem] = sourceColumn.items.splice(source.index, 1);
        destColumn.items.splice(destination.index, 0, movedItem);

        LayoutManager.saveLayout(newLayout);
        return newLayout;
    },

    removeComponent: (
        layout: LayoutColumn[],
        colIndex: number,
        itemIndex: number,
    ): LayoutColumn[] => {
        const newLayout = [...layout];
        newLayout[colIndex].items.splice(itemIndex, 1);
        LayoutManager.saveLayout(newLayout);
        return newLayout;
    },

    addComponent: (
        layout: LayoutColumn[],
        colIndex: number,
        componentKey: string,
    ): LayoutColumn[] => {
        const newLayout = [...layout];
        newLayout[colIndex].items.push(componentKey);
        LayoutManager.saveLayout(newLayout);
        return newLayout;
    },
};
