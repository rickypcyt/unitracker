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
    const now = new Date();
    const target = parseDateFromString(dateStr);
    if (!target) return '';
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0) return `in ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
}

export function formatDateShort(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    const date = parseDateFromString(dateStr);
    if (!date) return "";
    const weekday = date.toLocaleString('en-US', { weekday: 'short' });
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${weekday}, ${month} ${day}`;
}

/**
 * Checks if a date string is today
 * @param dateStr - The date string to check
 * @returns true if the date is today
 */
export function isToday(dateStr: string | null | undefined): boolean {
    if (!dateStr) return false;
    const date = parseDateFromString(dateStr);
    if (!date) return false;
    const now = new Date();
    return date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();
}

/**
 * Checks if a date string is tomorrow
 * @param dateStr - The date string to check
 * @returns true if the date is tomorrow
 */
export function isTomorrow(dateStr: string | null | undefined): boolean {
    if (!dateStr) return false;
    const date = parseDateFromString(dateStr);
    if (!date) return false;
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return date.getFullYear() === tomorrow.getFullYear() &&
        date.getMonth() === tomorrow.getMonth() &&
        date.getDate() === tomorrow.getDate();
} 