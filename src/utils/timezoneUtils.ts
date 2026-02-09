/**
 * Timezone utilities for UniTracker calendar
 * Provides timezone detection, conversion, and management functionality
 */

// Common timezone list for the timezone selector
export const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', offset: 0 },
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: -5 },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: -6 },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: -7 },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: -8 },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)', offset: -9 },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)', offset: -10 },
  { value: 'America/Sao_Paulo', label: 'Brasília Time (BRT)', offset: -3 },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)', offset: 0 },
  { value: 'Europe/Paris', label: 'Central European Time (CET)', offset: 1 },
  { value: 'Europe/Berlin', label: 'Central European Time (CET)', offset: 1 },
  { value: 'Europe/Moscow', label: 'Moscow Time (MSK)', offset: 3 },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)', offset: 4 },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)', offset: 5.5 },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)', offset: 8 },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', offset: 9 },
  { value: 'Asia/Seoul', label: 'Korea Standard Time (KST)', offset: 9 },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)', offset: 10 },
  { value: 'Pacific/Auckland', label: 'New Zealand Time (NZT)', offset: 12 },
];

/**
 * Get the user's current timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Get the user's preferred timezone from localStorage or return system timezone
 */
export function getPreferredTimezone(): string {
  const saved = localStorage.getItem('preferred-timezone');
  if (saved && isValidTimezone(saved)) {
    return saved;
  }
  return getUserTimezone();
}

/**
 * Save the preferred timezone to localStorage
 */
export function setPreferredTimezone(timezone: string): void {
  if (isValidTimezone(timezone)) {
    localStorage.setItem('preferred-timezone', timezone);
  }
}

/**
 * Check if a timezone identifier is valid
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get timezone offset for a given timezone
 */
export function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date();
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
  } catch {
    return 0;
  }
}

/**
 * Convert a date from one timezone to another
 */
export function convertTimezone(date: Date, fromTimezone: string, toTimezone: string): Date {
  try {
    // Format the date in the source timezone
    const formatted = date.toLocaleString('en-US', {
      timeZone: fromTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // Parse the formatted string and create a new date in the target timezone
    const parts = formatted.match(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/);
    if (!parts) return date;

    const [, month, day, year, hour, minute, second] = parts;
    const targetDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    
    // Adjust for the target timezone offset
    const offset = getTimezoneOffset(toTimezone) - getTimezoneOffset(fromTimezone);
    return new Date(targetDate.getTime() + (offset * 60 * 60 * 1000));
  } catch {
    return date;
  }
}

/**
 * Format a date in a specific timezone
 */
export function formatDateInTimezone(date: Date, timezone: string, options?: Intl.DateTimeFormatOptions): string {
  try {
    return date.toLocaleString('en-US', {
      timeZone: timezone,
      ...options
    });
  } catch {
    return date.toLocaleString();
  }
}

/**
 * Get timezone label for display
 */
export function getTimezoneLabel(timezone: string): string {
  const common = COMMON_TIMEZONES.find(tz => tz.value === timezone);
  if (common) return common.label;
  
  try {
    const offset = getTimezoneOffset(timezone);
    const offsetStr = offset >= 0 ? `+${offset}` : `${offset}`;
    return `${timezone} (UTC${offsetStr})`;
  } catch {
    return timezone;
  }
}

/**
 * Get all available timezones from the browser
 */
export function getAllTimezones(): string[] {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return COMMON_TIMEZONES.map(tz => tz.value);
  }
}

/**
 * Filter timezones by search term
 */
export function filterTimezones(searchTerm: string): typeof COMMON_TIMEZONES {
  const term = searchTerm.toLowerCase();
  return COMMON_TIMEZONES.filter(tz => 
    tz.label.toLowerCase().includes(term) || 
    tz.value.toLowerCase().includes(term)
  );
}
