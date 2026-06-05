export function normalizeDate(value: unknown): string {
  if (typeof value === 'string') {
    return value.slice(0, 10)
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, number>
    if (obj.year && obj.month && obj.day) {
      return `${obj.year}-${String(obj.month).padStart(2, '0')}-${String(obj.day).padStart(2, '0')}`
    }
  }

  return ''
}

export function extractDateTime(value: unknown): string | null {
  if (value == null || value === '') {
    return null
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const nested =
      obj.dateTime ??
      obj.DateTime ??
      obj.value ??
      obj.Value

    if (typeof nested === 'string') {
      return nested
    }
  }

  return null
}

export function formatAttendanceTime(
  value: unknown,
  timezone: string
): string {
  const raw = extractDateTime(value)
  if (!raw) {
    return '--:--'
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    return '--:--'
  }

  try {
    return parsed.toLocaleTimeString('en-US', {
      timeZone: timezone || 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return parsed.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }
}

export function roundWorkedHours(value: unknown): number {
  const hours = Number(value)
  if (!Number.isFinite(hours)) {
    return 0
  }

  return Math.round(hours * 10) / 10
}

export function formatWorkedHours(value: unknown): string {
  return `${roundWorkedHours(value).toFixed(1)}h`
}

export function pickField(
  source: Record<string, unknown> | null | undefined,
  ...keys: string[]
): unknown {
  if (!source) {
    return undefined
  }

  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return source[key]
    }
  }

  return undefined
}
