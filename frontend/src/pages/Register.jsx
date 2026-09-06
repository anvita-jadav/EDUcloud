import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Toast from '../components/Toast'

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'admin', label: 'Admin' },
]

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('student')
  const [form, setForm] = useState({
    name: '', email: '', password: '', roll_number: '', department: '', semester: '', subject: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signUp({ ...form, role })
      navigate('/')
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <h1>Join EduCloude</h1>
        <p>Register as a student, faculty member, or administrator to access your role-specific modules.</p>
      </div>

      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Create your account</h2>
          <p className="sub">One platform for all roles</p>

          {error && <div className="alert alert-danger">{error}</div>}

          <div style={{ marginBottom: 20 }}>
            <label className="form-group" style={{ display: 'block' }}>
              I am a…
            </label>
            <div className="segmented">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  className={role === r.value ? 'active' : ''}
                  onClick={() => setRole(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form" style={{ maxWidth: 'none' }}>
            <div className="form-group">
              <label>Full name</label>
              <input value={form.name} onChange={update('name')} placeholder="Your name" required />
            </div>
            {role === 'student' && (
              <>
                <div className="form-group">
                  <label>Roll number</label>
                  <input value={form.roll_number} onChange={update('roll_number')} placeholder="e.g. 4MK23CS010" />
                </div>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Department</label>
                    <input value={form.department} onChange={update('department')} placeholder="CSE" />
                  </div>
                  <div style={{ width: 16 }} />
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Semester</label>
                    <input value={form.semester} onChange={update('semester')} placeholder="5" />
                  </div>
                </div>
              </>
            )}
            {role === 'faculty' && (
              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Department</label>
                  <input value={form.department} onChange={update('department')} placeholder="CSE" />
                </div>
                <div style={{ width: 16 }} />
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Subject</label>
                  <input value={form.subject} onChange={update('subject')} placeholder="Data Structures" />
                </div>
              </div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={update('email')} placeholder="you@college.edu" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={form.password} onChange={update('password')} placeholder="••••••••" required minLength={6} />
            </div>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Creating account…' : 'Create account'}
            </button>
          </div>

          <p className="small" style={{ marginTop: 16, textAlign: 'center' }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>

      {error && <Toast type="error" message={error} onClose={() => setError('')} />}
    </div>
  )
}