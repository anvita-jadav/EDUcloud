import { createContext, useContext, useEffect, useRef, useState } from 'react'
import {
  auth,
  signInWithPopup,
  googleProvider,
  onAuthStateChanged,
  signOut as fbSignOut,
  deleteUser,
} from '../lib/firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { api, getCredToken, setCredToken, clearCredToken } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const manual = useRef(false)

  useEffect(() => {
    // Credential-based session (faculty/admin) takes priority over Firebase.
    if (getCredToken()) {
      loadCredUser()
      return
    }
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        if (!manual.current) loadUser()
      } else {
        setUser(null)
        setLoading(false)
      }
    })
    return () => unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadUser() {
    try {
      // Retry once: Render (free tier) cold starts can make the very first
      // request time out even for accounts that already exist.
      let me
      try {
        me = await api('/api/user/me')
      } catch {
        me = await api('/api/user/me')
      }
      setUser(me)
      return me
    } catch {
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  async function loadCredUser() {
    try {
      const me = await api('/api/user/me')
      setUser(me)
      setLoading(false)
    } catch {
      clearCredToken()
      setUser(null)
      setLoading(false)
    }
  }

  async function signUp({ email, password, name, faculty_id, ...profile }) {
    let fbUser = null
    manual.current = true
    try {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        fbUser = cred.user
      } catch (err) {
        throw new Error(friendlyAuthError(err))
      }
      try {
        await api('/api/user/register', { method: 'POST', body: { name, faculty_id, ...profile } })
      } catch (err) {
        if (fbUser) {
          try {
            await deleteUser(fbUser)
          } catch {
            // The user object may not be deletable on all providers.
          }
        }
        if (auth.currentUser) {
          try {
            await fbSignOut(auth)
          } catch {
            // ignore
          }
        }
        throw new Error(err.message || 'Registration failed')
      }
      const me = await loadUser()
      if (!me) throw new Error('Account created but we could not load your profile. Please sign in again.')
      return me
    } finally {
      manual.current = false
    }
  }

  async function signIn(email, password) {
    manual.current = true
    try {
      await signInWithEmailAndPassword(auth, email, password)
      const me = await loadUser()
      if (!me) throw new Error('Account not found. Please register first.')
      return me
    } catch (err) {
      if (err.message === 'Account not found. Please register first.') throw err
      throw new Error(friendlyAuthError(err))
    } finally {
      manual.current = false
    }
  }

  async function signInWithGoogle() {
    manual.current = true
    try {
      await signInWithPopup(auth, googleProvider)
      let me = await loadUser()
      if (!me) {
        // New Google user whose backend profile does not exist yet.
        const ok = await api('/api/user/oauth/register', { method: 'POST' }).catch(() => null)
        if (!ok) throw new Error('Account not found. Please register first.')
        me = await loadUser()
      }
      if (!me) throw new Error('Account not found. Please register first.')
      return me
    } catch (err) {
      if (err.message === 'Account not found. Please register first.') throw err
      throw new Error(friendlyAuthError(err))
    } finally {
      manual.current = false
    }
  }

  async function facultyLogin(username, password) {
    const res = await api('/api/user/credential-login', {
      method: 'POST',
      body: { username, password },
    })
    setCredToken(res.token)
    setUser(res.user)
    return res.user
  }

  async function adminLogin(username, password) {
    const res = await api('/api/user/admin-login', {
      method: 'POST',
      body: { username, password },
    })
    setCredToken(res.token)
    setUser(res.user)
    return res.user
  }

  async function signOut() {
    try {
      if (auth.currentUser) await fbSignOut(auth)
    } catch {
      // ignore
    }
    clearCredToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        facultyLogin,
        adminLogin,
        signOut,
        loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

function friendlyAuthError(err) {
  const code = err?.code || ''
  if (code === 'auth/email-already-in-use') return 'This email is already registered. Please sign in instead.'
  if (code === 'auth/invalid-email') return 'Please enter a valid email address.'
  if (code === 'auth/user-not-found') return 'No account found with this email.'
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') return 'Incorrect email or password.'
  if (code === 'auth/weak-password') return 'Password should be at least 6 characters.'
  if (code === 'auth/popup-closed-by-user') return 'Google sign-in was cancelled.'
  return err?.message || 'Authentication failed'
}

export function useAuth() {
  return useContext(AuthContext)
}