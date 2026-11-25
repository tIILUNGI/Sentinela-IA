import { createContext, useCallback, useContext, useEffect, useState } from 'react'
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
  const [user, setUser] = useState<User | null>(null)
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [orgId, setOrgIdState] = useState<string | null>(() => localStorage.getItem('sentinela_org_id'))
  const [loading, setLoading] = useState(() => Boolean(getAccessToken()))

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
      setUser(data.user)
      setMemberships(data.memberships || [])
      const current = localStorage.getItem('sentinela_org_id')
      const valid = data.memberships?.find((m: Membership) => m.organization_id === current)
      const nextOrg = valid ? current : (data.memberships?.[0]?.organization_id || null)
      if (nextOrg) {
        localStorage.setItem('sentinela_org_id', nextOrg)
        setOrgIdState(nextOrg)
      }
    } catch {
      clearTokens()
      setUser(null)
      setMemberships([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    if (!getAccessToken()) return
    api.get('/auth/me')
      .then(({ data }) => {
        if (!active) return
        setUser(data.user)
        setMemberships(data.memberships || [])
        const current = localStorage.getItem('sentinela_org_id')
        const valid = data.memberships?.find((m: Membership) => m.organization_id === current)
        const nextOrg = valid ? current : (data.memberships?.[0]?.organization_id || null)
        if (nextOrg) {
          localStorage.setItem('sentinela_org_id', nextOrg)
          setOrgIdState(nextOrg)
        }
      })
      .catch(() => {
        if (!active) return
        clearTokens()
        setUser(null)
        setMemberships([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    setTokens(data.access_token, data.refresh_token)
    await refreshMe()
  }

  const register = async (name: string, email: string, password: string, organization_name?: string) => {
    const { data } = await api.post('/auth/register', { name, email, password, organization_name })
    setTokens(data.access_token, data.refresh_token)
    await refreshMe()
  }

  const logout = async () => {
    try {
      if (getAccessToken()) await api.post('/auth/logout')
    } catch {
      // Clear local session regardless of network errors on logout.
    } finally {
      clearTokens()
      setUser(null)
      setMemberships([])
      setOrgIdState(null)
    }
  }

  const setOrgId = (id: string) => {
    localStorage.setItem('sentinela_org_id', id)
    setOrgIdState(id)
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
