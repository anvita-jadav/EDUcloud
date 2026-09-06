import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'
import GoogleIcon from '../components/GoogleIcon'

export default function Register() {
  const { signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [faculties, setFaculties] = useState([])
  const [facultyError, setFacultyError] = useState('')
  const [form, setForm] = useState({
    name: '', email: '', password: '', roll_number: '', department: '', semester: '', faculty_id: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api('/api/user/faculty-list')
      .then((d) => setFaculties(d.faculties || []))
      .catch(() => setFacultyError('Could not load faculty list. Please try again.'))
  }, [])

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  function validate() {
    if (!form.name.trim()) return 'Please enter your full name.'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email address.'
    if (form.password.length < 6) return 'Password must be at least 6 characters.'
    if (!form.roll_number.trim()) return 'Roll number is required.'
    if (!form.faculty_id) return 'Please select your faculty.'
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }
    setBusy(true)
    try {
      await signUp({ ...form })
      navigate('/')
    } catch (err) {
      setError(err.message || 'Registration failed')
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
        <h1>Join EduCloude as a Student</h1>
        <p>Create your student account and choose your faculty. Your faculty will be able to see you in their class.</p>
        <ul className="auth-features">
          <li>
            <span className="feat-ico">✓</span>
            <span><b>Verified signup</b><br />Your account is linked to the faculty you pick.</span>
          </li>
          <li>
            <span className="feat-ico">🔐</span>
            <span><b>Secure cloud storage</b><br />Google sign-in with encrypted student records.</span>
          </li>
          <li>
            <span className="feat-ico">⚡</span>
            <span><b>Instant access</b><br />Attendance, marks, and results — all in one place.</span>
          </li>
        </ul>
      </div>

      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Create your account</h2>
          <p className="sub">Students can sign up here</p>

          {error && <div className="alert alert-danger">{error}</div>}

          <button className="btn btn-google" type="button" onClick={handleGoogle}>
            <GoogleIcon /> Continue with Google
          </button>
          <div className="divider"><span>or sign up with email</span></div>

          <div className="form" style={{ maxWidth: 'none' }}>
            <div className="form-group">
              <label>Full name</label>
              <input value={form.name} onChange={update('name')} placeholder="Your name" required />
            </div>
            <div className="form-group">
              <label>Roll number</label>
              <input value={form.roll_number} onChange={update('roll_number')} placeholder="e.g. 4MK23CS010" required />
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
            <div className="form-group">
              <label>Your faculty</label>
              {facultyError && <p className="small" style={{ color: 'var(--danger)' }}>{facultyError}</p>}
              <select
                value={form.faculty_id}
                onChange={update('faculty_id')}
                disabled={!faculties.length}
              >
                <option value="">
                  {faculties.length ? 'Select your faculty…' : 'Loading faculty…'}
                </option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} — {f.department || 'Department'} ({f.subject || 'Subject'})
                  </option>
                ))}
              </select>
            </div>
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
    </div>
  )
}