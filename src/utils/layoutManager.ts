import TaskForm from "../components/tools/TaskForm";
import TaskList from "../components/tools/TaskList";
import ProgressTracker from "../components/tools/ProgressTracker";
import Calendar from "../components/tools/Calendar";
import StudyTimer from "../components/tools/StudyTimer";
import NoiseGenerator from "../components/tools/NoiseGenerator";
import Statistics from "../components/tools/Stats";
import Pomodoro from "../components/tools/Pomodoro";
// import KanbanBoard from "../components/tools/KanbanBoard";

export interface LayoutColumn {
    id: string;
    items: string[];
}

export interface ComponentConfig {
    name: string;
    component: React.FC<any>;
}

export const ComponentRegistry: Record<string, ComponentConfig> = {
    TaskForm: { component: TaskForm, name: "TF" },
    TaskList: { component: TaskList, name: "TL" },
    ProgressTracker: { component: ProgressTracker, name: "PT" },
    Calendar: { component: Calendar, name: "Cal" },
    StudyTimer: { component: StudyTimer, name: "ST" },
    NoiseGenerator: { component: NoiseGenerator, name: "NoiseGen" },
    Statistics: { component: Statistics, name: "Stats" },
    Pomodoro: { component: Pomodoro, name: "Pomo" },
    // KanbanBoard: { component: KanbanBoard, name: "Kanban Board" },
};

export const LayoutManager = {
    getInitialLayout: (): LayoutColumn[] => {
        const savedLayout = localStorage.getItem("layout");
        if (savedLayout) {
            return JSON.parse(savedLayout);
        }
        // Ahora 4 columnas
        return [
            { id: "column-1", items: ["ST", "Pomo"] },
            { id: "column-2", items: ["TF", "NoiseGen"] },
            { id: "column-3", items: ["Stats", "Cal"] },
            { id: "column-4", items: ["TL", "PT"] },
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
