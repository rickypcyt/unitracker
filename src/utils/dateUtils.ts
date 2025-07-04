/**
 * Utility functions for date formatting and manipulation
 */

/**
 * Formats a date string into DD/MM/YYYY format
 * @param dateStr - The date string to format (can be null or undefined)
 * @returns A formatted date string in the format "DD/MM/YYYY" or empty string if no date provided
 */
export function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
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
    const date = new Date(dateStr);
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
    const date = new Date(dateStr);
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
export function formatDateShort(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
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
    const date = new Date(dateStr);
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
    const date = new Date(dateStr);
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return date.getFullYear() === tomorrow.getFullYear() &&
        date.getMonth() === tomorrow.getMonth() &&
        date.getDate() === tomorrow.getDate();
} 