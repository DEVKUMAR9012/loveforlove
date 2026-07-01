// ─── String Utilities ─────────────────────────────────────────────────────────
import { INVITE_CODE_LENGTH } from './constants'

/** Generate a random alphanumeric invite code */
export const generateInviteCode = (length = INVITE_CODE_LENGTH) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No confusable 0/O/I/1
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

/** Capitalize first letter */
export const capitalize = (str = '') =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()

/** Truncate with ellipsis */
export const truncate = (str = '', maxLen = 80) =>
  str.length > maxLen ? str.slice(0, maxLen).trimEnd() + '…' : str

/** Get initials from a name */
export const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

/** Format file size bytes → human readable */
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

/** Format audio duration seconds → mm:ss */
export const formatDuration = (seconds = 0) => {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
