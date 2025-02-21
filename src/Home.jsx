import React, { useState, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Trash2, Plus, Move, Maximize2, Minimize2 } from 'lucide-react';

import TaskForm from './redux/TaskForm';
import TaskList from './redux/TaskList';
import ProgressTracker from './components/ProgressTracker';
import Achievements from './components/Achievements';
import Calendar from './components/Calendar';
import StudyTimer from './components/StudyTimer';
import Pomodoro from './components/Pomodoro';
import BrownNoise from './components/BrownNoise';

import {supabase} from './utils/supabaseClient'; // Asegúrate de importar tu archivo de configuración

const handleGoogleLogin = async () => {
  const { user, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });

  if (error) {
    console.error('Error during Google login:', error.message);
  } else {
    console.log('User logged in:', user);
    navigate('/'); // Redirigir a la página de inicio sin recargar
  }
};

// Componente del logo de Google
const GoogleLogo = () => (
<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="3 0 24 24" width="27"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
);

const AVAILABLE_COMPONENTS = {
  TaskForm: { component: TaskForm, name: 'Task Form', isWide: false },
  TaskList: { component: TaskList, name: 'Task List', isWide: false },
  ProgressTracker: { component: ProgressTracker, name: 'Progress Tracker', isWide: false },
  Achievements: { component: Achievements, name: 'Achievements', isWide: false },
  Calendar: { component: Calendar, name: 'Calendar', isWide: false },
  StudyTimer: { component: StudyTimer, name: 'StudyTimer', isWide: false },
  BrownNoise: { component: BrownNoise, name: 'BrownNoise', isWide: false },
  Pomodoro: { component: Pomodoro, name: 'Pomodoro', isWide: false }
};

const Home = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [layout, setLayout] = useState([
    { id: 'col-1', items: ['TaskForm', 'Calendar'] },
    { id: 'col-2', items: ['BrownNoise', 'StudyTimer', 'Pomodoro'] },
    { id: 'col-3', items: ['TaskList', 'ProgressTracker', 'Achievements'] }
  ]);
  const [wideComponents, setWideComponents] = useState(new Set());

  // Refs para controlar los componentes de sesión
  const brownNoiseRef = useRef(null);
  const pomodoroRef = useRef(null);
  const studyTimerRef = useRef(null);

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

    // Elimina de los componentes anchos si estaba expandido
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

  // Función para renderizar componentes y, en el caso de BrownNoise, Pomodoro y StudyTimer, pasarles refs
  const renderComponent = (componentKey) => {
    const ComponentToRender = AVAILABLE_COMPONENTS[componentKey].component;
    if (componentKey === 'BrownNoise') {
      return <ComponentToRender ref={brownNoiseRef} />;
    } else if (componentKey === 'Pomodoro') {
      return <ComponentToRender ref={pomodoroRef} />;
    } else if (componentKey === 'StudyTimer') {
      return <ComponentToRender ref={studyTimerRef} />;
    } else {
      return <ComponentToRender />;
    }
  };

  // Funciones para controlar la sesión
  const handleStartSession = () => {
    if (brownNoiseRef.current && brownNoiseRef.current.startNoise) {
      brownNoiseRef.current.startNoise();
    }
    if (pomodoroRef.current && pomodoroRef.current.startTimer) {
      pomodoroRef.current.startTimer();
    }
    if (studyTimerRef.current && studyTimerRef.current.startTimer) {
      studyTimerRef.current.startTimer();
    }
  };

  const handlePauseSession = () => {
    // Para BrownNoise, al no tener un botón de pausa separado, asumimos que
    // llamar a startNoise es lo que se espera (es como un toggle o simplemente reproducir).
    if (brownNoiseRef.current && brownNoiseRef.current.startNoise) {
      brownNoiseRef.current.startNoise();
    }
    if (pomodoroRef.current && pomodoroRef.current.pauseTimer) {
      pomodoroRef.current.pauseTimer();
    }
    if (studyTimerRef.current && studyTimerRef.current.pauseTimer) {
      studyTimerRef.current.pauseTimer();
    }
  };

  const handleEndSession = () => {
    // Para BrownNoise, End Sesh no hace nada
    if (pomodoroRef.current && pomodoroRef.current.finishCycle) {
      pomodoroRef.current.finishCycle();
    }
    if (studyTimerRef.current && studyTimerRef.current.finishStudySession) {
      studyTimerRef.current.finishStudySession();
    }
  };

  return (
    <div className="max-w-[1500px] mx-auto">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                            <div className="absolute top-2 right-2 z-10 flex gap-2">
                              <button
                                onClick={() => toggleComponentSize(componentKey)}
                                className="p-1 bg-gray-800 rounded hover:bg-gray-700 text-white"
                              >
                                {wideComponents.has(componentKey) ? (
                                  <Minimize2 size={16} />
                                ) : (
                                  <Maximize2 size={16} />
                                )}
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
                          <div
                            className={`rounded-lg shadow-lg ${
                              isEditing ? 'border-2 border-dashed border-gray-700' : ''
                            }`}
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
                      className="w-full border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-gray-600 hover:text-gray-300 flex items-center justify-center gap-2 bg-gray-900 p-2"
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

      {/* Botones de control de sesión y edición */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
  <button
    onClick={handleStartSession}
    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
  >
    Start Sesh
  </button>
  <button
    onClick={handlePauseSession}
    className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
  >
    Pause Sesh
  </button>
  <button
    onClick={handleEndSession}
    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
  >
    End Sesh
  </button>
  <button
    onClick={() => setIsEditing(!isEditing)}
    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
  >
    {isEditing ? 'Save Layout' : 'Edit Layout'}
  </button>
  
  {/* Nuevo botón para login con Google */}
  <button
    onClick={handleGoogleLogin}
    className="px-4 py-2 bg-white text-black border-2 border-black rounded hover:bg-gray-100 flex items-center justify-center"
  >
    <GoogleLogo />
    Login with Google
  </button>
</div>

    </div>
  );
};

export default Home;
