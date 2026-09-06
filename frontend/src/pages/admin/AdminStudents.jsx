import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

export default function AdminStudents() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    api('/api/admin/students')
      .then((d) => setRows(d.students || []))
      .catch((e) => setError(e.message))
  }, [])

  const filtered = rows.filter((s) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return [s.name, s.email, s.roll_number, s.department, s.faculty].some((v) =>
      String(v || '').toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <div className="page-head">
        <h1>Registered Students</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="space-btw" style={{ marginBottom: 16 }}>
          <p className="muted small" style={{ margin: 0 }}>
            {rows.length} student{rows.length === 1 ? '' : 's'} registered {rows.length ? '· assigned to their faculty on signup' : ''}
          </p>
          <input
            className="search-input"
            placeholder="Search name, roll, email, faculty…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {filtered.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Roll</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Semester</th>
                  <th>Faculty</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{s.name}</strong></td>
                    <td>{s.roll_number || '—'}</td>
                    <td>{s.email || '—'}</td>
                    <td>{s.department || '—'}</td>
                    <td>{s.semester || '—'}</td>
                    <td>
                      <span className={s.faculty_id ? 'badge badge-info' : 'badge badge-absent'}>
                        {s.faculty || 'Not assigned'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">
            {query ? 'No students match your search.' : 'No students have registered yet. Students self-register on the signup page.'}
          </p>
        )}
      </div>
    </div>
  )
}