// Script para migrar localStorage al nuevo sistema
import { StorageMigrator } from '../src/hooks/useStorage';

// Migraciones comunes
const migrations = [
  // Pomodoro
  { oldKey: 'pomodoroState', newKey: 'pomodoroState' },
  { oldKey: 'pomodoroModes', newKey: 'pomodoroModes' },
  { oldKey: 'pomodoroIsRunning', newKey: 'pomodoroIsRunning' },
  { oldKey: 'pomodorosThisSession', newKey: 'pomodorosThisSession' },
  
  // Study Timer
  { oldKey: 'studyTimerState', newKey: 'studyTimerState' },
  { oldKey: 'activeSessionId', newKey: 'activeSessionId' },
  
  // Workspaces
  { oldKey: 'workspacesHydrated', newKey: 'workspaces' },
  { oldKey: 'activeWorkspaceId', newKey: 'activeWorkspaceId' },
  { oldKey: 'lastActiveWorkspace', newKey: 'lastActiveWorkspace' },
  
  // Tasks
  { oldKey: 'tasksHydrated', newKey: 'tasks' },
  { oldKey: 'localTasks', newKey: 'localTasks' },
];

// Ejecutar migraciones
export function runMigrations() {
  migrations.forEach(({ oldKey, newKey }) => {
    StorageMigrator.migrateKey(oldKey, newKey);
  });
  
  // Limpiar keys antiguas con patrones
  StorageMigrator.clearPattern('pomodoroDailyCount_');
  StorageMigrator.clearPattern('temp_');
  
  console.log('Storage migration completed');
  console.log('Total storage size:', StorageMigrator.getStorageSize());
}

// Para ejecutar en desarrollo
if (typeof window !== 'undefined') {
  window.runStorageMigration = runMigrations;
}
