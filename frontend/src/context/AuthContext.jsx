import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        loadUser()
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser()
      } else {
        setUser(null)
      }
    })

    return () => listener?.subscription?.unsubscribe()
  }, [])

  async function loadUser() {
    try {
      const me = await api('/api/user/me')
      setUser({ supabaseId: me.user_id, ...me })
    } catch {
      setUser(null)
    }
  }

  async function signUp({ email, password, name, role, ...profile }) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    await api('/api/user/register', { method: 'POST', body: { name, role, ...profile } })
    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await loadUser()
    return data
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, loadUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
