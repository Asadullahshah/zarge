/**
 * Date utility functions with Karachi timezone support
 */
import { format, formatInTimeZone } from "date-fns-tz"

const KARACHI_TIMEZONE = "Asia/Karachi"

/**
 * Format a date in Karachi timezone
 */
export function formatDateInKarachi(
  date: Date | string,
  formatStr: string = "MMM d, yyyy"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return formatInTimeZone(dateObj, KARACHI_TIMEZONE, formatStr)
}

/**
 * Format a date with time in Karachi timezone
 */
export function formatDateTimeInKarachi(
  date: Date | string,
  formatStr: string = "MMMM d, yyyy 'at' h:mm a"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return formatInTimeZone(dateObj, KARACHI_TIMEZONE, formatStr)
}

/**
 * Get current date/time in Karachi timezone
 */
export function getKarachiNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: KARACHI_TIMEZONE }))
}



