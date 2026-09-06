import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GoogleIcon from '../components/GoogleIcon'

const ROLES = [
  { value: 'student', label: 'Student', hint: 'Sign in with your college email' },
  { value: 'faculty', label: 'Faculty', hint: 'Use the username & password given by the admin' },
  { value: 'admin', label: 'Admin', hint: 'Use the fixed admin credentials' },
]

export default function Login() {
  const { signIn, signInWithGoogle, facultyLogin, adminLogin } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('student')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function selectRole(value) {
    setRole(value)
    setError('')
    if (value === 'admin') setUsername('jadav')
    else if (username === 'jadav') setUsername('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (role === 'student') {
        await signIn(email, password)
      } else if (role === 'faculty') {
        await facultyLogin(username, password)
      } else {
        await adminLogin(username, password)
      }
      navigate('/')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogle() {
    setError('')
    try {
      await signInWithGoogle()
      navigate('/')
    } catch (err) {
      setError(err.message || 'Google sign-in failed')
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
        <ul className="auth-features">
          <li>
            <span className="feat-ico">📅</span>
            <span><b>Class QR attendance</b><br />Faculty set the class time — students scan to mark present.</span>
          </li>
          <li>
            <span className="feat-ico">🎯</span>
            <span><b>Role-based access</b><br />Separate experiences for students, faculty, and admins.</span>
          </li>
          <li>
            <span className="feat-ico">📊</span>
            <span><b>Grades &amp; reports</b><br />Internal marks, results, and attendance on one dashboard.</span>
          </li>
        </ul>
      </div>

      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Welcome back</h2>
          <p className="sub">Sign in to continue to EduCloude</p>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
              Are you a student, faculty, or admin?
            </label>
            <div className="segmented">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={role === r.value ? 'active' : ''}
                  onClick={() => selectRole(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <p className="small muted" style={{ marginTop: 8 }}>
              {ROLES.find((r) => r.value === role)?.hint}
            </p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {role === 'student' && (
            <button className="btn btn-google" type="button" onClick={handleGoogle}>
              <GoogleIcon /> Continue with Google
            </button>
          )}
          {role === 'student' && <div className="divider"><span>or sign in with email</span></div>}

          <div className="form" style={{ maxWidth: 'none' }}>
            {role === 'student' ? (
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@college.edu"
                  required
                  autoComplete="email"
                />
              </div>
            ) : (
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={role === 'admin' ? 'jadav' : 'username'}
                  required
                  autoComplete="username"
                />
              </div>
            )}

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </div>

          {role === 'student' && (
            <p className="small" style={{ marginTop: 16, textAlign: 'center' }}>
              Don&apos;t have an account? <Link to="/register">Create one</Link>
            </p>
          )}
        </form>
      </div>
    </div>
  )
}