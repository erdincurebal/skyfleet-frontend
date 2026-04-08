import dayjs from 'dayjs'

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return dayjs(value).format('DD MMM YYYY')
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  return dayjs(value).format('DD MMM YYYY HH:mm')
}

export function formatHours(value: number | string | null | undefined): string {
  if (value == null) return '—'
  const n = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(n)) return '—'
  return `${n.toFixed(1)} h`
}

export function isOverdue(nextDueDate: string | null | undefined): boolean {
  if (!nextDueDate) return false
  return dayjs(nextDueDate).isBefore(dayjs())
}

export function isDueSoon(nextDueDate: string | null | undefined, days = 7): boolean {
  if (!nextDueDate) return false
  const due = dayjs(nextDueDate)
  const now = dayjs()
  return due.isAfter(now) && due.isBefore(now.add(days, 'day'))
}
