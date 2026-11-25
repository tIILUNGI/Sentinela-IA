import { describe, expect, it, beforeEach } from 'vitest'
import { I18nProvider, useI18n } from './i18n'
import { renderHook, act } from '@testing-library/react'
import React from 'react'

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(I18nProvider, null, children)
}

describe('i18n', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.lang = 'en'
  })

  it('defaults to english and translates known keys', () => {
    const { result } = renderHook(() => useI18n(), { wrapper })
    expect(result.current.locale).toBe('en')
    expect(result.current.t('nav.commandCenter')).toBe('Command Center')
  })

  it('switches to portuguese', () => {
    const { result } = renderHook(() => useI18n(), { wrapper })
    act(() => result.current.setLocale('pt'))
    expect(result.current.locale).toBe('pt')
    expect(result.current.t('nav.commandCenter')).toBe('Command Center')
    expect(result.current.t('common.signOut')).toBe('Terminar sessão')
  })

  it('maps known backend errors and falls back safely', () => {
    const { result } = renderHook(() => useI18n(), { wrapper })
    expect(result.current.translateError('Invalid credentials')).toBe('Invalid email or password.')
    expect(result.current.translateError('AI unavailable')).toContain('AI')
  })
})
