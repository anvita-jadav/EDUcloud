import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import Toast from '../../components/Toast'

const EMPTY_FORM = {
  name: '', email: '', department: '', subject: '', username: '', password: '',
}

export default function AdminFaculty() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    try {
      const data = await api('/api/admin/faculty')
      setRows(data.faculty || [])
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function create(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.username.trim() || form.password.length < 6) {
      setToast('Name and username are required; password must be at least 6 characters.')
      return
    }
    try {
      await api('/api/admin/faculty', { method: 'POST', body: form })
      setToast('Faculty account created')
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      setToast(err.message)
    }
  }

  async function remove(id) {
    if (!confirm('Delete this faculty? Students assigned to them will lose their advisor.')) return
    try {
      await api(`/api/admin/faculty/${id}`, { method: 'DELETE' })
      setToast('Faculty deleted')
      load()
    } catch (err) {
      setToast(err.message)
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Faculty</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Create Faculty Account</h3>
          <p className="small muted" style={{ marginBottom: 12 }}>
            The faculty will sign in using the username and password you set here.
          </p>
          <form className="form" onSubmit={create}>
            <div className="form-group">
              <label>Full name</label>
              <input value={form.name} onChange={(e) => setField('name', e.target.value)} required />
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Department</label>
                <input value={form.department} onChange={(e) => setField('department', e.target.value)} />
              </div>
              <div style={{ width: 16 }} />
              <div className="form-group" style={{ flex: 1 }}>
                <label>Subject</label>
                <input value={form.subject} onChange={(e) => setField('subject', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Username</label>
                <input value={form.username} onChange={(e) => setField('username', e.target.value)} required />
              </div>
              <div style={{ width: 16 }} />
              <div className="form-group" style={{ flex: 1 }}>
                <label>Password</label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  placeholder="min 6 chars"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <button className="btn btn-primary">Create faculty</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12 }}>All Faculty</h3>
          <div className="table-wrap" style={{ maxHeight: 400, overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr><th>Name</th><th>Username</th><th>Department</th><th>Subject</th><th></th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.username}</td>
                    <td>{r.department || '—'}</td>
                    <td>{r.subject || '—'}</td>
                    <td>
                      <button className="btn btn-danger" style={{ padding: '4px 10px' }} onClick={() => remove(r.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {toast && <Toast type="error" message={toast} onClose={() => setToast('')} />}
    </div>
  )
}