import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Toast from '../components/Toast'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="brand" style={{ padding: 0, border: 'none' }}>
          <span className="brand-logo">E</span>
          <div>
            <div className="brand-name" style={{ fontSize: 22 }}>EduCloude</div>
            <div className="brand-sub" style={{ color: '#cbd5e1' }}>Connected on One Platform</div>
          </div>
        </div>
        <h1>Secure Cloud Student Information Management System</h1>
        <p>Centralized student, faculty, and admin workflows with privacy protection, RBAC, and encrypted data.</p>
      </div>

      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Welcome back</h2>
          <p className="sub">Sign in to continue to EduCloude</p>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="form" style={{ maxWidth: 'none' }}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </div>

          <p className="small" style={{ marginTop: 16, textAlign: 'center' }}>
            Don&apos;t have an account? <Link to="/register">Create one</Link>
          </p>
        </form>
      </div>

      {error && <Toast type="error" message={error} onClose={() => setError('')} />}
    </div>
  )
}