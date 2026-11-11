// Time utility functions shared between components

// Format a duration given in seconds as "HH:MM:SS" (hours always shown, may exceed 24)
export function formatHMS(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// Parse a duration value to seconds. Accepts "H:MM", "HH:MM:SS", or a bare number of seconds.
export function durationToSeconds(duration?: string | number | null): number {
  if (duration === null || duration === undefined || duration === '') return 0;
  if (typeof duration === 'number') return Number.isFinite(duration) ? duration : 0;
  const trimmed = duration.trim();
  if (/^\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  const parts = trimmed.split(':').map(Number);
  if (parts.some(n => !Number.isFinite(n))) return 0;
  if (parts.length === 3) return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
  if (parts.length === 2) return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60;
  return 0;
}

// Normalize any stored duration ("H:MM", "HH:MM:SS", bare seconds) to "HH:MM:SS"
export function formatDurationHMS(duration?: string | number | null): string {
  return formatHMS(durationToSeconds(duration));
}

// Convert 24h format (HH:MM) or timestamptz to 12h AM/PM format
export function to12Hour(time24: string): string {
  if (!time24) return '';

  try {
    let hours = 0;
    let minutes = 0;

    // Handle ISO date format: '2026-02-09T17:00:00+00:00'
    if (time24.includes('T')) {
      const timePart = time24.split('T')[1]; // '17:00:00+00:00'
      if (!timePart) return '';

      // Remove timezone info if present
      const cleanTimePart = timePart.split('+')[0]?.split('-')[0];
      if (!cleanTimePart) return '';

      const parts = cleanTimePart.split(':').map(Number);
      hours = parts[0] ?? 0;
      minutes = parts[1] ?? 0;
    }
    // Handle timestamptz format: '2026-02-09 09:00:00+00'
    else if (time24.includes(' ')) {
      const timePart = time24.split(' ')[1]; // '09:00:00+00'
      if (!timePart) return '';

      // Remove timezone info if present
      const cleanTimePart = timePart.split('+')[0]?.split('-')[0];
      if (!cleanTimePart) return '';

      const parts = cleanTimePart.split(':').map(Number);
      hours = parts[0] ?? 0;
      minutes = parts[1] ?? 0;
    }
    // Handle simple time format: "HH:MM" or "HH:MM:SS"
    else if (time24.includes(':')) {
      const [h, m] = time24.split(':').map(Number);
      hours = h ?? 0;
      minutes = m ?? 0;
    }
    else {
      return '';
    }

    // Validate hours and minutes
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.warn('Invalid time values in to12Hour:', time24, { hours, minutes });
      return '';
    }

    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours);
    return `${String(displayHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
  } catch (error) {
    console.warn('Error in to12Hour:', time24, error);
    return '';
  }
}

// Convert 12h AM/PM format or ISO timestamp to 24h format (HH:MM)
export function to24Hour(time12: string): string {
  if (!time12) {
    return '';
  }

  const trimmed = time12.trim();
  let timeToProcess = trimmed;

  // Handle ISO date format: '2026-02-09T10:00:00+00:00'
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    const timePart = trimmed.split('T')[1]; // '10:00:00+00:00'
    if (timePart) {
      // Remove timezone info if present (handles +00:00 format)
      const cleanTimePart = timePart.split('+')[0]?.split('-')[0]?.split('Z')[0];
      if (cleanTimePart) {
        timeToProcess = cleanTimePart;
      }
    }
  }
  // Handle timestamptz format starting with a full date: '2026-02-09 10:00:00+00'
  else if (/^\d{4}-\d{2}-\d{2}\s/.test(trimmed)) {
    const timePart = trimmed.split(' ')[1]; // '10:00:00+00'
    if (timePart) {
      // Remove timezone info if present
      const cleanTimePart = timePart.split('+')[0]?.split('-')[0]?.split('Z')[0];
      if (cleanTimePart) {
        timeToProcess = cleanTimePart;
      }
    }
  }

  // Remove seconds ONLY if they exist (hh:mm:ss or hh:mm:ss AM)
  const noSeconds = timeToProcess.replace(
    /^(\d{1,2}:\d{2})(:\d{2})(\s?[AP]M)?$/i,
    '$1$3'
  ).trim();

  // Check if it's already in 24h format (HH:MM)
  const is24hFormat = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(noSeconds);

  if (is24hFormat) {
    return noSeconds;
  }

  // Try 12h format
  const match = noSeconds.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (match) {
    let hours = parseInt(match[1] ?? '0', 10);
    const minutes = parseInt(match[2] ?? '0', 10);
    const period = (match[3] ?? '').toUpperCase();

    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const result = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    return result;
  }

  return '';
}

// Increment time by 30 minutes
export function incrementTime(time12: string): string {
  const time24 = to24Hour(time12);
  if (!time24) return time12;

  let [hours = 0, minutes = 0] = time24.split(':').map(Number);
  minutes += 30;
  if (minutes >= 60) {
    minutes -= 60;
    hours = (hours + 1) % 24;
  }
  return to12Hour(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
}

// Decrement time by 30 minutes
export function decrementTime(time12: string): string {
  const time24 = to24Hour(time12);
  if (!time24) return time12;

  let [hours = 0, minutes = 0] = time24.split(':').map(Number);
  minutes -= 30;
  if (minutes < 0) {
    minutes += 60;
    hours = hours - 1 < 0 ? 23 : hours - 1;
  }
  return to12Hour(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
}

// Convert DD/MM/YYYY to ISO format for database
export function parseDateForDB(date: string | null | undefined): string | null {
  if (!date) return null;

  // If it's already in ISO format, return as is
  if (date.match(/^\d{4}-\d{2}-\d{2}/)) return date;

  // Handle DD/MM/YYYY format and combine with time
  const [day, month, year] = date.split('/');
  if (day && month && year) {
    const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    // Always use midnight for deadline (date only)
    return `${dateStr}T00:00:00`;
  }
  return null;
}
