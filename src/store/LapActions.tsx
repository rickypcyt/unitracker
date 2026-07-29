import { useAppStore } from '@/store/appStore';
import { StudyService } from '@/services/StudyService';

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export const fetchLaps = async () => {
  const { laps } = useAppStore.getState();

  try {
    if (laps.isCached && laps.lastFetch && (Date.now() - laps.lastFetch < CACHE_DURATION)) {
      return;
    }

    const data = await StudyService.fetchLaps();
    useAppStore.getState().setLaps(data);
    useAppStore.getState().setLapsCached(true, Date.now());
    return data;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[DEBUG] Error en fetchLaps:', errorMsg, error);
    useAppStore.getState().setLapsError(errorMsg);
    throw error;
  }
};

export const createLap = async (lapData: any) => {
  try {
    const data = await StudyService.createLap(lapData);
    useAppStore.getState().addLap(data);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    useAppStore.getState().lapError(errorMsg);
  }
};

export const updateLap = async (id: string, updates: any) => {
  try {
    const data = await StudyService.updateLap(id, updates);
    useAppStore.getState().updateLap(id, data);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    useAppStore.getState().lapError(errorMsg);
  }
};

export const deleteLap = async (id: string) => {
  try {
    await StudyService.deleteLap(id);
    useAppStore.getState().deleteLap(id);
    return { success: true, id };
  } catch (error) {
    console.error('[DEBUG] Error en deleteLap:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    useAppStore.getState().lapError(errorMsg);
    throw error;
  }
};

// Action to force a refresh of laps
export const forceLapRefresh = async () => {
  useAppStore.getState().invalidateCache();
  return fetchLaps();
};