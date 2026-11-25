import { describe, expect, it } from 'vitest'
import { cn, formatDate } from './utils'

describe('cn', () => {
  it('merges class names and resolves tailwind conflicts', () => {
    expect(cn('px-2', 'px-4', 'text-sm')).toBe('px-4 text-sm')
  })
})

describe('formatDate', () => {
  it('returns dash for empty value', () => {
    expect(formatDate(null)).toBe('-')
    expect(formatDate(undefined)).toBe('-')
  })

  it('returns original value for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })

  it('formats a valid ISO date', () => {
    const out = formatDate('2026-01-15T10:30:00Z')
    expect(typeof out).toBe('string')
    expect(out.length).toBeGreaterThan(5)
  })
})
