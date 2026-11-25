import { describe, expect, it, beforeEach } from 'vitest'
import { handleLocalRequest } from './localEngine'

function req(method: string, url: string, data?: unknown, headers: Record<string, string> = {}) {
  return handleLocalRequest({ method, url, data, headers, baseURL: '' } as any)
}

describe('localEngine', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('logs in demo user and returns tokens', async () => {
    const res: any = await req('post', '/auth/login', { email: 'demo@sentinela.ai', password: 'SentinelaDemo2026!' })
    expect(res.status).toBe(200)
    expect(res.data.access_token).toContain('local:')
    expect(res.data.refresh_token).toContain('local-refresh:')
  })

  it('rejects invalid credentials', async () => {
    await expect(req('post', '/auth/login', { email: 'demo@sentinela.ai', password: 'wrong' })).rejects.toMatchObject({ response: { status: 401 } })
  })

  it('returns me with memberships for valid token', async () => {
    const login: any = await req('post', '/auth/login', { email: 'demo@sentinela.ai', password: 'SentinelaDemo2026!' })
    const me: any = await req('get', '/auth/me', undefined, { Authorization: `Bearer ${login.data.access_token}` })
    expect(me.data.user.email).toBe('demo@sentinela.ai')
    expect(me.data.memberships.length).toBeGreaterThan(0)
  })

  it('answers document questions with citations', async () => {
    const login: any = await req('post', '/auth/login', { email: 'demo@sentinela.ai', password: 'SentinelaDemo2026!' })
    const token = login.data.access_token
    const org = (await req('get', '/auth/me', undefined, { Authorization: `Bearer ${token}` }) as any).data.memberships[0].organization_id
    const docs: any = await req('get', '/documents', undefined, { Authorization: `Bearer ${token}`, 'X-Organization-ID': org })
    const docId = docs.data[0].id
    const qa: any = await req('post', `/documents/${docId}/questions`, { question: 'What should I do on token compromise?' }, { Authorization: `Bearer ${token}`, 'X-Organization-ID': org })
    expect(qa.data.answer.toLowerCase()).toContain('token')
    expect(qa.data.citations.length).toBeGreaterThan(0)
    expect(qa.data.citations[0]).toHaveProperty('page_number')
    expect(qa.data.citations[0]).toHaveProperty('chunk_index')
  })
})
