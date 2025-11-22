import { useCallback, useEffect, useState } from 'react';

type StorageValue<T> = T | null;
type StorageKey = string;

interface UseStorageOptions<T> {
  defaultValue?: T;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
}

interface UseStorageReturn<T> {
  value: StorageValue<T>;
  setValue: (value: T | ((prev: StorageValue<T>) => T)) => void;
  removeValue: () => void;
  isLoading: boolean;
}

// Hook centralizado para manejar localStorage con error handling y tipado
export function useStorage<T>(
  key: StorageKey,
  options: UseStorageOptions<T> = {}
): UseStorageReturn<T> {
  const { defaultValue = null, serialize = JSON.stringify, deserialize = JSON.parse } = options;

  const [value, setValueState] = useState<StorageValue<T>>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  // Obtener valor del localStorage
  const getValue = useCallback((): StorageValue<T> => {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return deserialize(item);
    } catch (error) {
      console.warn(`Error parsing localStorage key "${key}":`, error);
      return defaultValue;
    }
  }, [key, defaultValue, deserialize]);

  // Guardar valor en localStorage
  const setValue = useCallback((newValue: T | ((prev: StorageValue<T>) => T)) => {
    try {
      const valueToStore = typeof newValue === 'function' 
        ? (newValue as Function)(getValue()) 
        : newValue;
      
      setValueState(valueToStore);
      localStorage.setItem(key, serialize(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, serialize, getValue]);

  // Remover valor del localStorage
  const removeValue = useCallback(() => {
    try {
      setValueState(defaultValue);
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  // Inicializar valor al montar el componente
  useEffect(() => {
    setValueState(getValue());
    setIsLoading(false);
  }, [getValue]);

  // Sincronizar cambios entre tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setValueState(deserialize(e.newValue));
        } catch (error) {
          console.warn(`Error syncing localStorage key "${key}":`, error);
        }
      } else if (e.key === key && e.newValue === null) {
        setValueState(defaultValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, defaultValue, deserialize]);

  return { value, setValue, removeValue, isLoading };
}

// Hook especializado para objetos complejos con validación
export function useObjectStorage<T extends Record<string, any>>(
  key: StorageKey,
  options: UseStorageOptions<T> & { validator?: (obj: any) => obj is T } = {}
): UseStorageReturn<T> {
  const { validator, ...restOptions } = options;

  const safeDeserialize = useCallback((value: string): T => {
    try {
      const parsed = JSON.parse(value);
      if (validator && !validator(parsed)) {
        console.warn(`Invalid object structure for key "${key}"`);
        return options.defaultValue as T;
      }
      return parsed;
    } catch (error) {
      console.warn(`Error parsing object for key "${key}":`, error);
      return options.defaultValue as T;
    }
  }, [key, options.defaultValue, validator]);

  return useStorage<T>(key, { ...restOptions, deserialize: safeDeserialize });
}

// Hook para arrays con métodos útiles
export function useArrayStorage<T>(
  key: StorageKey,
  options: UseStorageOptions<T[]> = {}
) {
  const { value, setValue, removeValue, isLoading } = useStorage<T[]>(key, {
    defaultValue: [],
    ...options,
  });

  const addItem = useCallback((item: T) => {
    setValue((prev) => [...(prev || []), item]);
  }, [setValue]);

  const removeItem = useCallback((predicate: (item: T) => boolean) => {
    setValue((prev) => (prev || []).filter(predicate));
  }, [setValue]);

  const updateItem = useCallback((predicate: (item: T) => boolean, updater: (item: T) => T) => {
    setValue((prev) => (prev || []).map(item => predicate(item) ? updater(item) : item));
  }, [setValue]);

  const clearArray = useCallback(() => {
    setValue([]);
  }, [setValue]);

  return {
    value,
    setValue,
    removeValue,
    isLoading,
    addItem,
    removeItem,
    updateItem,
    clearArray,
  };
}

// Hook para contadores con persistencia
export function useCounterStorage(
  key: StorageKey,
  initialValue: number = 0
) {
  const { value, setValue, removeValue, isLoading } = useStorage<number>(key, {
    defaultValue: initialValue,
  });

  const increment = useCallback((by: number = 1) => {
    setValue((prev) => (prev || 0) + by);
  }, [setValue]);

  const decrement = useCallback((by: number = 1) => {
    setValue((prev) => Math.max(0, (prev || 0) - by));
  }, [setValue]);

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [setValue, initialValue]);

  return {
    count: value || 0,
    setCount: setValue,
    increment,
    decrement,
    reset,
    removeCount: removeValue,
    isLoading,
  };
}

// Hook para settings con auto-save
export function useSettingsStorage<T extends Record<string, any>>(
  key: StorageKey,
  defaultSettings: T
) {
  const { value, setValue, isLoading } = useObjectStorage<T>(key, {
    defaultValue: defaultSettings,
  });

  const updateSetting = useCallback(<K extends keyof T>(setting: K, value: T[K]) => {
    setValue((prev) => ({
      ...(prev || defaultSettings),
      [setting]: value,
    }) as T);
  }, [setValue, defaultSettings]);

  const updateSettings = useCallback((updates: Partial<T>) => {
    setValue((prev) => ({
      ...(prev || defaultSettings),
      ...updates,
    }) as T);
  }, [setValue, defaultSettings]);

  const resetSettings = useCallback(() => {
    setValue(defaultSettings);
  }, [setValue, defaultSettings]);

  return {
    settings: value || defaultSettings,
    updateSetting,
    updateSettings,
    resetSettings,
    isLoading,
  };
}

// Utilidades para migración de localStorage
export class StorageMigrator {
  static migrateKey(oldKey: string, newKey: string, transform?: (value: any) => any) {
    try {
      const oldValue = localStorage.getItem(oldKey);
      if (oldValue !== null) {
        const value = transform ? transform(JSON.parse(oldValue)) : JSON.parse(oldValue);
        localStorage.setItem(newKey, JSON.stringify(value));
        localStorage.removeItem(oldKey);
        console.log(`Migrated storage key from "${oldKey}" to "${newKey}"`);
      }
    } catch (error) {
      console.warn(`Error migrating storage key from "${oldKey}" to "${newKey}":`, error);
    }
  }

  static clearPattern(pattern: string) {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      });
      console.log(`Cleared localStorage keys matching pattern: ${pattern}`);
    } catch (error) {
      console.warn(`Error clearing localStorage pattern "${pattern}":`, error);
    }
  }

  static getStorageSize(): string {
    try {
      let total = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
      return `${(total / 1024).toFixed(2)} KB`;
    } catch (error) {
      console.warn('Error calculating localStorage size:', error);
      return 'Unknown';
    }
  }
}
