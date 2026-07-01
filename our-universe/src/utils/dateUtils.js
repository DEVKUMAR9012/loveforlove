// ─── Date Utilities ───────────────────────────────────────────────────────────
import { formatDistanceToNow, format, differenceInDays, differenceInCalendarDays, parseISO } from 'date-fns'

/**
 * Days between two dates (inclusive of start).
 * @param {Date|string} start
 * @param {Date} [end=new Date()]
 * @returns {number}
 */
export const daysBetween = (start, end = new Date()) => {
  const s = typeof start === 'string' ? parseISO(start) : start
  return Math.abs(differenceInCalendarDays(end, s)) + 1
}

/**
 * Days until next anniversary from a given start date.
 * @param {Date|string} anniversary
 * @returns {number}
 */
export const daysUntilAnniversary = (anniversary) => {
  const now   = new Date()
  const date  = typeof anniversary === 'string' ? parseISO(anniversary) : anniversary
  const next  = new Date(now.getFullYear(), date.getMonth(), date.getDate())
  if (next < now) next.setFullYear(now.getFullYear() + 1)
  return differenceInCalendarDays(next, now)
}

/**
 * Format a date for Timeline display: "June 14, 2025"
 */
export const formatMemoryDate = (date) => {
  const d = date?.toDate ? date.toDate() : new Date(date)
  return format(d, 'MMMM d, yyyy')
}

/**
 * Relative time: "3 hours ago", "2 days ago"
 */
export const fromNow = (date) => {
  const d = date?.toDate ? date.toDate() : new Date(date)
  return formatDistanceToNow(d, { addSuffix: true })
}

/**
 * Group an array of items by year, using a date field.
 * @param {Array} items
 * @param {string} dateField - The key of the Firestore Timestamp field
 * @returns {Object} { '2025': [...items], '2024': [...items] }
 */
export const groupByYear = (items, dateField = 'date') => {
  return items.reduce((acc, item) => {
    const date = item[dateField]?.toDate ? item[dateField].toDate() : new Date(item[dateField])
    const year = date.getFullYear().toString()
    if (!acc[year]) acc[year] = []
    acc[year].push(item)
    return acc
  }, {})
}

/**
 * Convert a Firestore Timestamp to a JS Date safely.
 */
export const toDate = (timestamp) => {
  if (!timestamp) return null
  if (timestamp?.toDate) return timestamp.toDate()
  if (timestamp instanceof Date) return timestamp
  return new Date(timestamp)
}
