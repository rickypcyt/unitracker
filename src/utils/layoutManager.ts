// Importa tus componentes
import TaskForm from "../components/tools/TaskForm";
import { TaskList } from "../components/tools/TaskList";
import Calendar from "../components/tools/Calendar";
import StudyTimer from "../components/tools/StudyTimer";
import NoiseGenerator from "../components/tools/NoiseGenerator";
import Statistics from "../components/tools/Stats";
import Pomodoro from "../components/tools/Pomodoro";
// import KanbanBoard from "../components/tools/KanbanBoard";

// Tipos
export interface LayoutColumn {
  id: string;
  items: string[];
}

export interface ComponentConfig {
  name: string;
  component: React.FC<any>;
}

// El registro de componentes
export const ComponentRegistry: Record<string, ComponentConfig> = {
  TaskForm: { component: TaskForm, name: "TF" },
  TaskList: { component: TaskList, name: "TL" },
  StudyTimer: { component: StudyTimer, name: "ST" },
  NoiseGenerator: { component: NoiseGenerator, name: "NoiseGen" },
  Statistics: { component: Statistics, name: "Stats" },
  Pomodoro: { component: Pomodoro, name: "Pomo" },
  Calendar: { component: Calendar, name: "Calendar" },
  // KanbanBoard: { component: KanbanBoard, name: "Kanban Board" },
};

// El gestor de layouts
export const LayoutManager = {
  getInitialLayout: (columns = 4): LayoutColumn[] => {
    const saved = localStorage.getItem(`layout-${columns}`);
    if (saved) return JSON.parse(saved);

    // Defaults para cada número de columnas
    const defaults: Record<number, LayoutColumn[]> = {
      1: [
        {
          id: "column-1",
          items: [
            "StudyTimer",
            "Pomodoro",
            "TaskForm",
            "Calendar",
            "NoiseGenerator",
            "Statistics",
            "TaskList",
          ],
        },
      ],
      2: [
        {
          id: "column-1",
          items: ["StudyTimer", "Pomodoro", "TaskForm", "Calendar", "NoiseGenerator"],
        },
        { id: "column-2", items: ["Statistics", "TaskList"] },
      ],
      3: [
        { id: "column-1", items: ["TaskForm", "Calendar", "TaskList"] },
        { id: "column-2", items: ["Pomodoro", "NoiseGenerator"] },
        { id: "column-3", items: ["Statistics", "TaskList"] },
      ],
      4: [
        { id: "column-1", items: ["StudyTimer", "Pomodoro"] },
        { id: "column-2", items: ["TaskForm", "Calendar", "NoiseGenerator"] },
        { id: "column-3", items: ["Statistics"] },
        { id: "column-4", items: ["TaskList"] },
      ],
    };
    return defaults[columns] || defaults[4];
  },

  saveLayout: (layout: LayoutColumn[], columns: number) => {
    localStorage.setItem(`layout-${columns}`, JSON.stringify(layout));
  },

  updateLayoutAfterDrag: (
    layout: LayoutColumn[],
    result: any,
    columns: number
  ): LayoutColumn[] => {
    const { source, destination } = result;
    if (!destination) return layout;

    const newLayout = JSON.parse(JSON.stringify(layout));
    const sourceColumn = newLayout.find((col) => col.id === source.droppableId);
    const destColumn = newLayout.find(
      (col) => col.id === destination.droppableId
    );
    const [movedItem] = sourceColumn.items.splice(source.index, 1);
    destColumn.items.splice(destination.index, 0, movedItem);

    LayoutManager.saveLayout(newLayout, columns);
    return newLayout;
  },

  removeComponent: (
    layout: LayoutColumn[],
    colIndex: number,
    itemIndex: number,
    columns: number
  ): LayoutColumn[] => {
    const newLayout = JSON.parse(JSON.stringify(layout));
    newLayout[colIndex].items.splice(itemIndex, 1);
    LayoutManager.saveLayout(newLayout, columns);
    return newLayout;
  },

  addComponent: (
    layout: LayoutColumn[],
    colIndex: number,
    componentKey: string,
    columns: number
  ): LayoutColumn[] => {
    const newLayout = JSON.parse(JSON.stringify(layout));
    newLayout[colIndex].items.push(componentKey);
    LayoutManager.saveLayout(newLayout, columns);
    return newLayout;
  },
};
