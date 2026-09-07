import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

export default function SelectMentor() {
  const { user, loadUser } = useAuth()
  const navigate = useNavigate()
  const [faculties, setFaculties] = useState([])
  const [selected, setSelected] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api('/api/user/faculty-list')
      .then((d) => setFaculties(d.faculties || []))
      .catch((e) => setError(e.message))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selected) {
      setError('Please select your teacher from the list.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await api('/api/student/mentor', { method: 'POST', body: { faculty_id: selected } })
      const me = await loadUser()
      navigate(me && me.role === 'student' ? '/student' : '/')
    } catch (err) {
      setError(err.message || 'Could not set your teacher. Please try again.')
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
        <h1>Welcome, {user?.name || 'Student'}!</h1>
        <p>Pick your teacher to get access to your dashboard. Your teacher will be able to see you in their class.</p>
        <ul className="auth-features">
          <li>
            <span className="feat-ico">👩‍🏫</span>
            <span><b>Choose your mentor</b><br />Select from the list of teachers added by your college admin.</span>
          </li>
          <li>
            <span className="feat-ico">🔗</span>
            <span><b>Linked instantly</b><br />Your teacher sees you in their student list right away.</span>
          </li>
        </ul>
      </div>

      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Select your teacher</h2>
          <p className="sub">This assigns your account to a faculty mentor</p>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="form" style={{ maxWidth: 'none' }}>
            <div className="form-group">
              <label>Available teachers</label>
              {faculties.length === 0 && !error && (
                <p className="small muted">Loading teachers added by the admin…</p>
              )}
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                disabled={!faculties.length || busy}
              >
                <option value="">
                  {faculties.length ? 'Select your teacher…' : 'No teachers available'}
                </option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} — {f.department || 'Department'} ({f.subject || 'Subject'})
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={busy || !faculties.length}>
              {busy ? 'Saving…' : 'Assign me to this teacher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}