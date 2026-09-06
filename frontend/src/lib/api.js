import { API_URL, supabase } from './supabase'

export async function api(path, options = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!res.ok) {
    const detail = data?.detail || (typeof data === 'string' ? data : 'Request failed')
    throw new Error(detail)
  }
  return data
}
