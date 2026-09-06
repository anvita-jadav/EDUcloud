import { auth } from './firebase'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const TIMEOUT = 30000
const CRED_TOKEN_KEY = 'educloude.credToken'

export function getCredToken() {
  return localStorage.getItem(CRED_TOKEN_KEY) || ''
}

export function setCredToken(token) {
  localStorage.setItem(CRED_TOKEN_KEY, token)
}

export function clearCredToken() {
  localStorage.removeItem(CRED_TOKEN_KEY)
}

export async function api(path, options = {}) {
  let token = null
  if (auth?.currentUser) {
    token = await auth.currentUser.getIdToken()
  } else {
    token = getCredToken()
  }

  const hasBody = options.body !== undefined && options.body !== null
  const headers = {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT)

  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      body: hasBody ? JSON.stringify(options.body) : undefined,
      signal: options.signal || controller.signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw new Error('Network error. Check your connection and try again.')
  } finally {
    clearTimeout(timer)
  }

  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (res.status === 401 && getCredToken()) {
    clearCredToken()
  }

  if (!res.ok) {
    const detail = data?.detail || (typeof data === 'string' ? data : 'Request failed')
    throw new Error(detail)
  }
  return data
}