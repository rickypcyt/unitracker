/**
 * Utility functions for date formatting and manipulation
 */

/**
 * Gets the current date in local timezone as YYYY-MM-DD string
 * @returns A date string in the format "YYYY-MM-DD"
 */
export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a date string into a Date object, prioritizing DD/MM/YYYY or DD-MM-YYYY formats.
 */
export function parseDateFromString(dateStr: string): Date | null {
    const trimmed = dateStr.trim();
    if (!trimmed) return null;

    const slashMatch = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
    if (slashMatch) {
        const day = slashMatch[1];
        const month = slashMatch[2];
        const year = slashMatch[3];
        if (!day || !month || !year) return null;
        const isoDate = `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00`;
        const parsed = new Date(isoDate);
        return isNaN(parsed.getTime()) ? null : parsed;
    }

    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Formats a date string into DD/MM/YYYY format
 * @param dateStr - The date string to format (can be null or undefined)
 * @returns A formatted date string in the format "DD/MM/YYYY" or empty string if no date provided
 */
export function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    const date = parseDateFromString(dateStr);
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Formats a date string into a localized date string with time
 * @param dateStr - The date string to format (can be null or undefined)
 * @returns A formatted date string in the format "DD/MM/YYYY HH:mm" or empty string if no date provided
 */
export function formatDateTime(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    const date = parseDateFromString(dateStr);
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Formats a date string into a localized date string with time and AM/PM
 * @param dateStr - The date string to format (can be null or undefined)
 * @returns A formatted date string in the format "DD/MM/YYYY HH:mm AM/PM" or empty string if no date provided
 */
export function formatDateTimeWithAmPm(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    const date = parseDateFromString(dateStr);
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = String(hours % 12 || 12).padStart(2, '0');
    return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`;
}

/**
 * Formats a date for input fields (YYYY-MM-DD)
 * @param date - The date to format
 * @returns A formatted date string in the format "YYYY-MM-DD"
 */
export function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Formats a date string into 'Mon, Jun 30' format
 * @param dateStr - The date string to format (can be null or undefined)
 * @returns A formatted date string like 'Mon, Jun 30' or empty string if no date provided
 */
/**
 * Gets a human-readable string of time remaining or overdue
 * @param dateStr - The target date string
 * @returns A string like "in 2 days" or "3 days ago"
 */
export function getTimeRemainingString(dateStr: string): string {
    const dateOnly = getDateOnlyString(dateStr);
    if (!dateOnly) return '';
    const [year, month, day] = dateOnly.split('-').map(Number);
    if (!year || !month || !day) return '';
    const target = new Date(year, month - 1, day);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
}

export function formatDateShort(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    const dateOnly = getDateOnlyString(dateStr);
    if (!dateOnly) return "";
    const [year, month, day] = dateOnly.split('-').map(Number);
    if (!year || !month || !day) return "";
    const date = new Date(year, month - 1, day);
    const weekday = date.toLocaleString('en-US', { weekday: 'short' });
    const monthName = date.toLocaleString('en-US', { month: 'short' });
    return `${weekday}, ${monthName} ${day}`;
}

/**
 * Extracts YYYY-MM-DD from a date string without timezone conversion
 */
function getDateOnlyString(dateStr: string): string | null {
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    const slashMatch = dateStr.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
    if (slashMatch && slashMatch[1] && slashMatch[2] && slashMatch[3]) {
        return `${slashMatch[3]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[1].padStart(2, '0')}`;
    }
    return null;
}

/**
 * Checks if a date string is today
 * @param dateStr - The date string to check
 * @returns true if the date is today
 */
export function isToday(dateStr: string | null | undefined): boolean {
    if (!dateStr) return false;
    const dateOnly = getDateOnlyString(dateStr);
    if (!dateOnly) return false;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return dateOnly === todayStr;
}

/**
 * Checks if a date string is tomorrow
 * @param dateStr - The date string to check
 * @returns true if the date is tomorrow
 */
export function isTomorrow(dateStr: string | null | undefined): boolean {
    if (!dateStr) return false;
    const dateOnly = getDateOnlyString(dateStr);
    if (!dateOnly) return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    return dateOnly === tomorrowStr;
}

export function fromNow(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const date = parseDateFromString(dateStr);
    if (!date) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHr = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHr / 24);
    const diffMonth = Math.round(diffDay / 30);
    const diffYear = Math.round(diffDay / 365);

    const past = diffMs > 0;

    if (Math.abs(diffSec) < 60) return past ? 'a few seconds ago' : 'in a few seconds';
    if (Math.abs(diffMin) < 60) return past ? `${diffMin} minute${diffMin === 1 ? '' : 's'} ago` : `in ${Math.abs(diffMin)} minute${Math.abs(diffMin) === 1 ? '' : 's'}`;
    if (Math.abs(diffHr) < 24) return past ? `${diffHr} hour${diffHr === 1 ? '' : 's'} ago` : `in ${Math.abs(diffHr)} hour${Math.abs(diffHr) === 1 ? '' : 's'}`;
    if (Math.abs(diffDay) < 30) return past ? `${diffDay} day${diffDay === 1 ? '' : 's'} ago` : `in ${Math.abs(diffDay)} day${Math.abs(diffDay) === 1 ? '' : 's'}`;
    if (Math.abs(diffMonth) < 12) return past ? `${diffMonth} month${diffMonth === 1 ? '' : 's'} ago` : `in ${Math.abs(diffMonth)} month${Math.abs(diffMonth) === 1 ? '' : 's'}`;
    return past ? `${diffYear} year${diffYear === 1 ? '' : 's'} ago` : `in ${Math.abs(diffYear)} year${Math.abs(diffYear) === 1 ? '' : 's'}`;
}

export function formatLongDateTime(dateStr: string | null | undefined): string {
    if (!dateStr) return '';
    const date = parseDateFromString(dateStr);
    if (!date) return '';
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${month} ${day}, ${year} at ${displayHour}:${minutes} ${ampm}`;
} 