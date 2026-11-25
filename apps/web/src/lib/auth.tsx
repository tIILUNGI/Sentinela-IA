import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, clearTokens, getAccessToken, setTokens } from './api'

type User = { id: string; name: string; email: string; status: string; is_superuser: boolean }
type Membership = { organization_id: string; organization_name?: string; role: string; permissions: string[] }
type AuthCtx = {
  user: User | null
  memberships: Membership[]
  orgId: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, organization_name?: string) => Promise<void>
  logout: () => Promise<void>
  setOrgId: (id: string) => void
  refreshMe: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [orgId, setOrgIdState] = useState<string | null>(() => localStorage.getItem('sentinela_org_id'))
  const [loading, setLoading] = useState(() => Boolean(getAccessToken()))

  const applyMeData = useCallback((data: any) => {
    setUser(data.user)
    const ms: Membership[] = data.memberships || []
    setMemberships(ms)
    const current = localStorage.getItem('sentinela_org_id')
    const valid = ms.find(m => m.organization_id === current)
    const nextOrg = valid ? current : (ms[0]?.organization_id || null)
    if (nextOrg) {
      localStorage.setItem('sentinela_org_id', nextOrg)
      setOrgIdState(nextOrg)
    } else {
      localStorage.removeItem('sentinela_org_id')
      setOrgIdState(null)
    }
  }, [])

  const refreshMe = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setUser(null)
      setMemberships([])
      setLoading(false)
      return
    }
    try {
      const { data } = await api.get('/auth/me')
      applyMeData(data)
    } catch {
      clearTokens()
      setUser(null)
      setMemberships([])
      setOrgIdState(null)
    } finally {
      setLoading(false)
    }
  }, [applyMeData])

  useEffect(() => {
    let active = true
    if (!getAccessToken()) return
    api.get('/auth/me')
      .then(({ data }) => {
        if (active) applyMeData(data)
      })
      .catch(() => {
        if (!active) return
        clearTokens()
        setUser(null)
        setMemberships([])
        setOrgIdState(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [applyMeData])

  const login = async (email: string, password: string) => {
    localStorage.removeItem('sentinela_org_id')
    qc.clear()
    const { data } = await api.post('/auth/login', { email, password })
    setTokens(data.access_token, data.refresh_token)
    const meRes = await api.get('/auth/me')
    applyMeData(meRes.data)
    setLoading(false)
  }

  const register = async (name: string, email: string, password: string, organization_name?: string) => {
    localStorage.removeItem('sentinela_org_id')
    qc.clear()
    const { data } = await api.post('/auth/register', { name, email, password, organization_name })
    setTokens(data.access_token, data.refresh_token)
    const meRes = await api.get('/auth/me')
    applyMeData(meRes.data)
    setLoading(false)
  }

  const logout = async () => {
    try {
      if (getAccessToken()) await api.post('/auth/logout')
    } catch {
      // Clear local session regardless of network errors on logout.
    } finally {
      clearTokens()
      qc.clear()
      setUser(null)
      setMemberships([])
      setOrgIdState(null)
    }
  }

  const setOrgId = (id: string) => {
    localStorage.setItem('sentinela_org_id', id)
    setOrgIdState(id)
    qc.clear()
    void refreshMe()
  }

  return <Ctx.Provider value={{ user, memberships, orgId, loading, login, register, logout, setOrgId, refreshMe }}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
