// Importar cliente HMR para cambios en tiempo real - REMOVIDO TEMPORALMENTE
// import '@/utils/dayflowHMRClient';

import { Suspense, lazy, memo, useEffect, useMemo, useState } from 'react';
import { ViewType, createDayView, createDragPlugin, createMonthView, createWeekView, createYearView, useCalendarApp } from '@dayflow/core';
import { filterTasksForCalendar, tasksToEvents } from '@/utils/taskToEventMapper';

import { fetchTasks } from '@/store/TaskActions';
// Importar para conexión con base de datos
import { useAppStore } from '@/store/appStore';
import useDemoMode from '@/utils/useDemoMode';
import useTheme from '@/hooks/useTheme';

// Lazy load DayFlowCalendar to reduce initial bundle size
const DayFlowCalendar = lazy(() => import('@dayflow/core').then(module => ({ 
  default: module.DayFlowCalendar 
})));

// Memoized sidebar component to prevent infinite re-renders
const CalendarSidebar = memo(({ app, calendars, toggleCalendarVisibility, toggleAll, isCollapsed, setCollapsed, selectedView }: any) => {
  // 🎨 Obtener colores de UniTracker
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  const colors = {
    bgPrimary: computedStyle.getPropertyValue('--bg-primary').trim(),
    bgSecondary: computedStyle.getPropertyValue('--bg-secondary').trim(),
    textPrimary: computedStyle.getPropertyValue('--text-primary').trim(),
    textSecondary: computedStyle.getPropertyValue('--text-secondary').trim(),
    borderPrimary: computedStyle.getPropertyValue('--border-primary').trim(),
    accentPrimary: computedStyle.getPropertyValue('--accent-primary').trim(),
  };

  if (isCollapsed) {
    return (
      <div className="h-full flex items-center justify-center p-2" style={{ backgroundColor: colors.bgSecondary, borderColor: colors.borderPrimary }}>
        <button 
          onClick={() => setCollapsed(false)}
          className="p-2 rounded-lg hover:bg-opacity-10 hover:bg-[var(--accent-primary)] transition-colors"
          style={{ color: colors.textPrimary }}
          title="Expand Sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <aside className="flex h-full flex-col" style={{ backgroundColor: colors.bgSecondary, borderRight: `1px solid ${colors.borderPrimary}` }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: colors.borderPrimary }}>
        <h3 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Calendars</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => toggleAll(true)}
            className="text-xs px-2 py-1 rounded hover:bg-opacity-10 hover:bg-[var(--accent-primary)] transition-colors"
            style={{ color: colors.textSecondary }}
          >
            All
          </button>
          <button 
            onClick={() => toggleAll(false)}
            className="text-xs px-2 py-1 rounded hover:bg-opacity-10 hover:bg-[var(--accent-primary)] transition-colors"
            style={{ color: colors.textSecondary }}
          >
            None
          </button>
          <button 
            onClick={() => setCollapsed(true)}
            className="p-1 rounded hover:bg-opacity-10 hover:bg-[var(--accent-primary)] transition-colors"
            style={{ color: colors.textSecondary }}
            title="Collapse Sidebar"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {calendars.map((calendar: any) => (
            <div key={calendar.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-opacity-5 hover:bg-[var(--accent-primary)] transition-colors">
              <input
                type="checkbox"
                checked={calendar.isVisible}
                onChange={() => toggleCalendarVisibility(calendar.id, !calendar.isVisible)}
                className="rounded"
                style={{ accentColor: colors.accentPrimary }}
              />
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: calendar.colors?.eventColor || colors.accentPrimary }}
              />
              <span className="text-sm flex-1" style={{ color: colors.textPrimary }}>
                {calendar.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t" style={{ borderColor: colors.borderPrimary }}>
        <div className="space-y-2 text-xs" style={{ color: colors.textSecondary }}>
          <div className="flex justify-between">
            <span>Current Date:</span>
            <span style={{ color: colors.textPrimary }}>
              {app.getCurrentDate().toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Total Events:</span>
            <span style={{ color: colors.textPrimary }}>
              {app.getEvents().length}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Current View:</span>
            <span style={{ color: colors.textPrimary }}>
              {selectedView || 'week'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
});

CalendarSidebar.displayName = 'CalendarSidebar';


const DayFlowCalendarComponent = memo(() => {
  const realTasks = useAppStore((state) => state.tasks.tasks);
  const { isDemo, demoTasks } = useDemoMode();
  const tasks = isDemo ? demoTasks : realTasks;
  
  // Use the same theme system as the rest of the app
  const { currentTheme } = useTheme();

  // Estado para la vista seleccionada con persistencia en localStorage
  const [selectedView, setSelectedView] = useState<'day' | 'week' | 'month' | 'year'>(() => {
    const savedView = localStorage.getItem('dayflow-calendar-view');
    return (savedView as 'day' | 'week' | 'month' | 'year') || 'week';
  });

  // Guardar la vista seleccionada en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('dayflow-calendar-view', selectedView);
  }, [selectedView]);

  // Cargar tareas desde la base de datos al montar el componente
  useEffect(() => {
    if (!isDemo) {
      const loadTasks = async () => {
        try {
          await fetchTasks();
        } catch (error) {
          console.error('Error loading tasks for calendar:', error);
        }
      };
      loadTasks();
    }
  }, [isDemo]);

  // Refrescar tareas periódicamente para mantener el calendario actualizado
  useEffect(() => {
    if (!isDemo) {
      const interval = setInterval(() => {
        fetchTasks(undefined, true); // Forzar refresh cada 5 minutos
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [isDemo]);

  // Escuchar eventos de actualización de tareas
  useEffect(() => {
    const handleTaskUpdate = () => {
      if (!isDemo) {
        fetchTasks(undefined, true);
      }
    };

    window.addEventListener('refreshCalendar', handleTaskUpdate);
    return () => window.removeEventListener('refreshCalendar', handleTaskUpdate);
  }, [isDemo]);

  //  La persistencia de vista ahora se maneja con el callback oficial de DayFlow
  useEffect(() => {
    const handleViewChange = (event: CustomEvent) => {
      if (event.detail?.view) {
        setSelectedView(event.detail.view);
      }
    };

    window.addEventListener('dayflow-view-change', handleViewChange as EventListener);
    return () => window.removeEventListener('dayflow-view-change', handleViewChange as EventListener);
  }, []);

  //  HMR para cambios en tiempo real en DayFlow
  useEffect(() => {
    const handleDayFlowHMR = (event: CustomEvent) => {
      console.log(' DayFlow HMR: Recibido evento de actualización', event.detail);
      
      // Forzar actualización del componente si es necesario
      const dayflowElement = document.querySelector('[data-dayflow-calendar]') as HTMLElement;
      if (dayflowElement) {
        // Limpiar estado de React para forzar re-render
        const reactKeys = Object.keys(dayflowElement).filter(key => 
          key.startsWith('__reactFiber') || 
          key.startsWith('_reactInternal') || 
          key.startsWith('__reactProps')
        );
        
        reactKeys.forEach(key => {
          delete (dayflowElement as any)[key];
        });
        
        console.log(' DayFlow HMR: Forzando re-render del componente');
      }
    };

    window.addEventListener('dayflow-hmr-update', handleDayFlowHMR as EventListener);
    return () => window.removeEventListener('dayflow-hmr-update', handleDayFlowHMR as EventListener);
  }, []);

  // Create drag plugin for DayFlow
  const dragPlugin = createDragPlugin({
    enableDrag: true,
    enableResize: true,
    enableCreate: true,
    enableAllDayCreate: true,
    supportedViews: [ViewType.YEAR, ViewType.MONTH, ViewType.WEEK, ViewType.DAY],
  });

  // 🎨 Sincronizar DayFlow con el sistema de temas de UniTracker (arreglado para evitar bucle infinito)
  useEffect(() => {
    const root = document.documentElement;
    
    // Remover atributos de DayFlow que puedan interferir
    root.removeAttribute('data-dayflow-theme-override');
    root.removeAttribute('data-theme');
    
    // Aplicar el tema de UniTracker a DayFlow
    root.classList.remove('light', 'dark');
    root.classList.add(currentTheme);
    root.style.colorScheme = currentTheme;
    
    // 🎨 Obtener colores de UniTracker UNA VEZ
    const computedStyle = getComputedStyle(root);
    const accentColor = computedStyle.getPropertyValue('--accent-primary').trim();
    const bgPrimary = computedStyle.getPropertyValue('--bg-primary').trim();
    const bgSecondary = computedStyle.getPropertyValue('--bg-secondary').trim();
    const bgTertiary = computedStyle.getPropertyValue('--bg-tertiary').trim();
    const textPrimary = computedStyle.getPropertyValue('--text-primary').trim();
    const textSecondary = computedStyle.getPropertyValue('--text-secondary').trim();
    const borderPrimary = computedStyle.getPropertyValue('--border-primary').trim();
    
    // Aplicar colores de UniTracker a los elementos de DayFlow
    const dayflowStyles = `
      .df-calendar {
        --df-bg-primary: ${bgPrimary};
        --df-bg-secondary: ${bgSecondary};
        --df-bg-tertiary: ${bgTertiary};
        --df-text-primary: ${textPrimary};
        --df-text-secondary: ${textSecondary};
        --df-border-primary: ${borderPrimary};
        --df-accent-primary: ${accentColor};
        --df-accent-hover: ${accentColor}20;
        --df-accent-active: ${accentColor}30;
      }
      
      /* Estilos para eventos de DayFlow que coincidan con UniTracker */
      .calendar-event {
        background-color: ${accentColor} !important;
        border-color: ${accentColor} !important;
        color: white !important;
      }
      
      .calendar-event:hover {
        background-color: ${accentColor}dd !important;
      }
      
      /* Header de DayFlow */
      .df-header {
        background-color: ${bgSecondary} !important;
        border-color: ${borderPrimary} !important;
      }
      
      /* Celdas del calendario */
      .df-time-grid-cell {
        border-color: ${borderPrimary} !important;
        background-color: ${bgPrimary} !important;
      }
      
      .df-time-grid-cell:hover {
        background-color: ${bgSecondary} !important;
      }
      
      /* Eventos de todo el día */
      .df-all-day-content {
        background-color: ${bgPrimary} !important;
      }
    `;
    
    // Crear o actualizar el style tag para DayFlow
    let styleTag = document.getElementById('dayflow-theme-sync') as HTMLStyleElement;
    if (!styleTag) {
      styleTag = document.createElement('style') as HTMLStyleElement;
      styleTag.id = 'dayflow-theme-sync';
      styleTag.type = 'text/css';
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = dayflowStyles;
    
    console.log('🎨 DayFlow Calendar - Synchronized with UniTracker theme:', {
      currentTheme,
      accentColor,
      hasStyleTag: !!styleTag
    });
  }, [currentTheme]);

  // Convert tasks to DayFlow events using the new mapper
  const events = useMemo(() => {
    console.log('DEBUG: Total tasks available:', tasks.length);
    console.log('DEBUG: Sample tasks:', tasks.slice(0, 5).map(t => ({
      id: t.id,
      title: t.title,
      completed: t.completed,
      deadline: t.deadline,
      hasDeadline: !!t.deadline,
      recurrence_type: t.recurrence_type,
      recurrence_weekdays: t.recurrence_weekdays,
      start_time: t.start_time,
      end_time: t.end_time
    })));
    
    // DEBUG: Buscar específicamente la tarea "Recu POO"
    const recuPooTask = tasks.find(t => t.title === 'Recu POO');
    if (recuPooTask) {
      console.log('DEBUG: Found Recu POO task:', {
        id: recuPooTask.id,
        title: recuPooTask.title,
        completed: recuPooTask.completed,
        deadline: recuPooTask.deadline,
        hasDeadline: !!recuPooTask.deadline,
        recurrence_type: recuPooTask.recurrence_type,
        recurrence_weekdays: recuPooTask.recurrence_weekdays,
        start_time: recuPooTask.start_time,
        end_time: recuPooTask.end_time,
        assignment: recuPooTask.assignment,
        difficulty: recuPooTask.difficulty
      });
    } else {
      console.log('DEBUG: Recu POO task NOT found in tasks array');
    }
    
    // Filter tasks for calendar display
    const tasksForCalendar = filterTasksForCalendar(tasks, {
      includeCompleted: false, // Don't show completed tasks by default
      includeWithoutDeadlines: false, // Only show tasks with deadlines
    });
    
    console.log('DEBUG: Tasks filtered for calendar:', tasksForCalendar.length);
    
    // DEBUG: Verificar si Recu POO pasó el filtro
    const recuPooAfterFilter = tasksForCalendar.find(t => t.title === 'Recu POO');
    if (recuPooAfterFilter) {
      console.log('DEBUG: Recu POO passed filter - will be converted to event');
    } else {
      console.log('DEBUG: Recu POO was filtered out - checking why...');
      if (recuPooTask) {
        console.log('DEBUG: Recu POO filter analysis:', {
          completed: recuPooTask.completed, // Should be false
          hasDeadline: !!recuPooTask.deadline, // Should be true
          deadline: recuPooTask.deadline
        });
      }
    }
    
    // If no tasks to show, add demo tasks if in demo mode
    let tasksToProcess = tasksForCalendar;
    if (tasksToProcess.length === 0 && isDemo) {
      console.log('DEBUG: Demo mode - adding test tasks');
      tasksToProcess = [
        {
          id: 'test-1',
          title: 'Test Task 1 - Today',
          completed: false,
          deadline: new Date().toISOString(),
          start_time: '10:00',
          end_time: '11:00',
          assignment: 'Test Assignment',
          difficulty: 'easy'
        },
        {
          id: 'test-2', 
          title: 'Test Task 2 - Tomorrow',
          completed: false,
          deadline: new Date(Date.now() + 86400000).toISOString(),
          start_time: '14:00',
          end_time: '15:00',
          assignment: 'Test Assignment',
          difficulty: 'medium'
        },
        {
          id: 'test-3',
          title: 'Test Task 3 - All Day',
          completed: false,
          deadline: new Date(Date.now() + 172800000).toISOString(),
          assignment: 'Test Assignment',
          difficulty: 'hard'
        }
      ];
    }
    
    // Convert tasks to events using the mapper
    const convertedEvents = tasksToEvents(tasksToProcess);
    
    console.log(`Converted ${tasksToProcess.length} tasks to ${convertedEvents.length} calendar events`);
    
    // DEBUG: Verificar eventos creados
    console.log('DEBUG: Created events:', convertedEvents.map(e => ({
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      meta: e.meta
    })));
    
    return convertedEvents;
  }, [tasks, isDemo]);

  // Memoize views with optimized configuration
  const views = useMemo(() => [
    createDayView(), // Vista diaria con mini calendar y event list
    createWeekView(), // Vista semanal con time slots y current time indicator  
    createMonthView(), // Vista mensual con virtual scrolling
    createYearView({
      showTimedEventsInYearView: true, // Show timed events in year view
    }), 
  ], []);

  // Memoized callback functions to prevent infinite re-renders
  const handleViewChange = useMemo(() => (view: any) => {
    console.log(' DayFlow: View changed to:', view);
    // Guardar la vista seleccionada en localStorage
    if (view?.type) {
      setSelectedView(view.type);
    }
  }, []);

  const handleEventCreate = useMemo(() => async (event: any) => {
    console.log(' DayFlow: Event created:', event);
    // Aquí puedes sincronizar con tu base de datos si es necesario
    // Por ahora, los eventos se crean desde las tareas existentes
  }, []);

  const handleEventUpdate = useMemo(() => async (event: any) => {
    console.log(' DayFlow: Event updated:', event);
    // Sincronizar actualización con tu base de datos
    // Puedes actualizar la tarea correspondiente en Supabase
  }, []);

  const handleEventDelete = useMemo(() => async (eventId: string) => {
    console.log(' DayFlow: Event deleted:', eventId);
    // Sincronizar eliminación con tu base de datos
    // Puedes eliminar o marcar como completada la tarea correspondiente
  }, []);

  // Memoized sidebar render function
  const sidebarRender = useMemo(() => (props: any) => {
    return <CalendarSidebar {...props} selectedView={selectedView} />;
  }, [selectedView]);

  const calendar = useCalendarApp({
    views,
    events,
    initialDate: new Date(),
    defaultView: selectedView as any, // Initial view from localStorage
    theme: { 
      mode: currentTheme as 'light' | 'dark' 
    }, // Pass the current theme to DayFlow
    plugins: [dragPlugin], // Add drag plugin
    // SIDEBAR DISABLED - UniTracker Configuration
    useSidebar: {
      enabled: false
    },
    //  CALLBACKS OFICIALES DE DAYFLOW PARA SINCRONIZACIÓN CON BASE DE DATOS
    callbacks: {
      //  Callback para cambios de vista (oficial DayFlow)
      onViewChange: handleViewChange,
      //  Callbacks para eventos
      onEventCreate: handleEventCreate,
      onEventUpdate: handleEventUpdate,
      onEventDelete: handleEventDelete,
    },
  });


  useEffect(() => {
    // Añadir CSS para mejorar la UX del calendario
    const style = document.createElement('style');
    style.textContent = `
      .df-time-grid-cell {
        cursor: pointer !important;
      }
      .df-time-grid-cell:hover {
        background-color: rgba(59, 130, 246, 0.1) !important;
      }
      .df-all-day-cell {
        cursor: pointer !important;
      }
      .df-all-day-cell:hover {
        background-color: rgba(59, 130, 246, 0.1) !important;
      }
    `;
    document.head.appendChild(style);

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log(' ESC PRESSED - CANCELLING EVENT CREATION - CRITICAL UX FEATURE');
        
        //  Método 1: Simular clic fuera para cancelar el modo de creación
        const outsideClick = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          clientX: 0,
          clientY: 0,
        });
        document.body.dispatchEvent(outsideClick);
        
        setTimeout(() => {
          // Buscar cualquier modal/dialogo visible
          const dialogs = document.querySelectorAll('[role="dialog"], .modal, .overlay');
          dialogs.forEach(dialog => {
            const dialogElement = dialog as HTMLElement;
            if (dialogElement.style && dialogElement.style.display !== 'none') {
              dialogElement.style.display = 'none';
              console.log(' Closed modal/dialog via ESC');
            }
          });
          
          const closeButtons = document.querySelectorAll(
            '[aria-label*="Close"], [aria-label*="close"], .close, [data-action="close"], button[title*="Close"]'
          );
          closeButtons.forEach(btn => {
            (btn as HTMLElement).click();
            console.log(' Pressed close button via ESC');
          });
          
          const tempElements = document.querySelectorAll('[data-creating], .event-creating, .temp-event');
          tempElements.forEach(element => {
            element.remove();
            console.log(' Removed temporary event element via ESC');
          });
        }, 50); // Reducido a 50ms para respuesta más rápida
      }
    };

    document.addEventListener('keydown', handleEscape, true);

    return () => {
      document.removeEventListener('keydown', handleEscape, true);
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
      console.log(' Cleaned up ESC handler and styles');
    };
  }, []);

  return (
    <div className="w-full h-full">
      <div className="bg-[var(--bg-primary)] rounded-lg overflow-hidden h-full">
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-[var(--text-secondary)]">Loading calendar...</div>
          </div>
        }>
          <DayFlowCalendar calendar={calendar} />
        </Suspense>
      </div>
    </div>
  );
});

DayFlowCalendarComponent.displayName = 'DayFlowCalendarComponent';

export default DayFlowCalendarComponent;
