/**
 * Utility functions for date formatting and manipulation
 */

/**
 * Formats a date string into a localized date string
 * @param dateStr - The date string to format (can be null or undefined)
 * @returns A formatted date string in the format "MMM DD, YYYY" or empty string if no date provided
 */
export function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
} 