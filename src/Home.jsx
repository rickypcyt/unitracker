import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Trash2, Plus, Move, Maximize2, Minimize2 } from 'lucide-react';

import TaskForm from './redux/TaskForm';
import TaskList from './redux/TaskList';
import ProgressTracker from './components/ProgressTracker';
import Achievements from './components/Achievements';
import Calendar from './components/Calendar';
import Counter from './components/Counter';
import Pomodoro from './components/Pomodoro';
import BrownNoise from './components/BrownNoise';

const AVAILABLE_COMPONENTS = {
  TaskForm: { component: TaskForm, name: 'Task Form', isWide: false },
  TaskList: { component: TaskList, name: 'Task List', isWide: false },
  ProgressTracker: { component: ProgressTracker, name: 'Progress Tracker', isWide: false },
  Achievements: { component: Achievements, name: 'Achievements', isWide: false },
  Calendar: { component: Calendar, name: 'Calendar', isWide: false },
  Counter: { component: Counter, name: 'Counter', isWide: false },
  BrownNoise: { component: BrownNoise, name: 'BrownNoise', isWide: false },
  Pomodoro: { component: Pomodoro, name: 'Pomodoro', isWide: false }
};

const Home = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [layout, setLayout] = useState([
    { id: 'col-1', items: ['TaskForm', 'Calendar'] },
    { id: 'col-2', items: [ 'Counter','Pomodoro','BrownNoise'] },
    { id: 'col-3', items: ['TaskList','ProgressTracker', 'Achievements'] }
  ]);
  const [wideComponents, setWideComponents] = useState(new Set());

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const newLayout = JSON.parse(JSON.stringify(layout));

    const sourceCol = newLayout.find(col => col.id === source.droppableId);
    const destCol = newLayout.find(col => col.id === destination.droppableId);

    const [removed] = sourceCol.items.splice(source.index, 1);
    destCol.items.splice(destination.index, 0, removed);

    setLayout(newLayout);
  };

  const toggleComponentSize = (componentKey) => {
    const newWideComponents = new Set(wideComponents);
    if (newWideComponents.has(componentKey)) {
      newWideComponents.delete(componentKey);
    } else {
      newWideComponents.add(componentKey);
    }
    setWideComponents(newWideComponents);
  };

  const removeComponent = (colIndex, itemIndex) => {
    const newLayout = [...layout];
    const componentKey = newLayout[colIndex].items[itemIndex];
    newLayout[colIndex].items.splice(itemIndex, 1);
    setLayout(newLayout);
    
    // Remove from wide components if it was expanded
    if (wideComponents.has(componentKey)) {
      const newWideComponents = new Set(wideComponents);
      newWideComponents.delete(componentKey);
      setWideComponents(newWideComponents);
    }
  };

  const addComponent = (colIndex) => {
    const usedComponents = layout.flatMap(col => col.items);
    const availableComponents = Object.keys(AVAILABLE_COMPONENTS)
      .filter(comp => !usedComponents.includes(comp));

    if (availableComponents.length === 0) return;

    const newLayout = [...layout];
    newLayout[colIndex].items.push(availableComponents[0]);
    setLayout(newLayout);
  };

  const renderComponent = (componentKey) => {
    const ComponentToRender = AVAILABLE_COMPONENTS[componentKey].component;
    return <ComponentToRender />;
  };

  return (
    <div className="max-w-[1500px] mx-auto">

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 ga">
          {layout.map((column, colIndex) => (
            <Droppable key={column.id} droppableId={column.id}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {column.items.map((componentKey, index) => (
                    <Draggable
                      key={componentKey}
                      draggableId={`${componentKey}-${column.id}`}
                      index={index}
                      isDragDisabled={!isEditing}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`relative ${wideComponents.has(componentKey) ? 'lg:col-span-2' : ''}`}
                          style={{
                            ...provided.draggableProps.style,
                            gridColumn: wideComponents.has(componentKey) ? 'span 2' : 'auto',
                          }}
                        >
                          {isEditing && (
                            <div className="absolute top-10 right-10 z-10 flex gap-2">
                              <button
                                onClick={() => toggleComponentSize(componentKey)}
                                className="p-1 bg-gray-800 rounded hover:bg-gray-700 text-white"
                              >
                                {wideComponents.has(componentKey) ? 
                                  <Minimize2 size={16} /> : 
                                  <Maximize2 size={16} />
                                }
                              </button>
                              <button
                                {...provided.dragHandleProps}
                                className="p-1 bg-gray-800 rounded hover:bg-gray-700 text-white"
                              >
                                <Move size={16} />
                              </button>
                              <button
                                onClick={() => removeComponent(colIndex, index)}
                                className="p-1 bg-red-900 rounded hover:bg-red-800 text-white"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                          <div className={`  rounded-lg shadow-lg 
                            ${isEditing ? 'border-2 border-dashed border-gray-700' : ''}`}
                          >
                            {renderComponent(componentKey)}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {isEditing && (
                    <button
                      onClick={() => addComponent(colIndex)}
                      className="w-full  border-2 border-dashed border-gray-700 rounded-lg 
                        text-gray-400 hover:border-gray-600 hover:text-gray-300 
                        flex items-center justify-center gap-2 bg-gray-900"
                    >
                      <Plus size={20} />
                      Add Component
                    </button>
                  )}
                </div>
              )}
            </Droppable>
            
          ))}

        </div>

      </DragDropContext>
      <button
  onClick={() => setIsEditing(!isEditing)}
  className="fixed bottom-4 right-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
>
  {isEditing ? 'Save Layout' : 'Edit Layout'}
</button>

    </div>
    
  );
};

export default Home;