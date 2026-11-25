import axios from 'axios'
import { handleLocalRequest } from './localEngine'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
const STANDALONE_MODE = import.meta.env.VITE_STANDALONE_MODE === 'true'

export const api = axios.create({
  baseURL: API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sentinela_access_token')
  const orgId = localStorage.getItem('sentinela_org_id')
  const locale = localStorage.getItem('sentinela_locale') || 'en'
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (orgId) config.headers['X-Organization-ID'] = orgId
  config.headers['Accept-Language'] = locale
  if (STANDALONE_MODE || (token && token.startsWith('local:'))) {
    config.adapter = () => handleLocalRequest(config)
  }
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('sentinela_refresh_token')
  if (!refreshToken) return null
  if (refreshToken.startsWith('local-refresh:')) {
    const uid = refreshToken.slice('local-refresh:'.length)
    const next = `local:${uid}`
    setTokens(next, refreshToken)
    return next
  }
  try {
    const { data } = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refreshToken })
    if (data?.access_token && data?.refresh_token) {
      setTokens(data.access_token, data.refresh_token)
      return data.access_token
    }
    return null
  } catch {
    clearTokens()
    return null
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as (typeof error.config & { _retry?: boolean; _localFallback?: boolean }) | undefined

    // Automatic local persistence fallback when deployed frontend-only (e.g. Vercel without backend).
    if (!error.response && original && !original._localFallback) {
      original._localFallback = true
      return handleLocalRequest(original)
    }

    const status = error?.response?.status
    const url = String(original?.url || '')
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')

    if (status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null
        })
      }
      const nextToken = await refreshPromise
      if (nextToken) {
        original.headers = original.headers || {}
        original.headers.Authorization = `Bearer ${nextToken}`
        return api(original)
      }
    }
    return Promise.reject(error)
  },
)

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('sentinela_access_token', access)
  localStorage.setItem('sentinela_refresh_token', refresh)
}

export function clearTokens() {
  localStorage.removeItem('sentinela_access_token')
  localStorage.removeItem('sentinela_refresh_token')
  localStorage.removeItem('sentinela_org_id')
}

export function getAccessToken() {
  return localStorage.getItem('sentinela_access_token')
}
