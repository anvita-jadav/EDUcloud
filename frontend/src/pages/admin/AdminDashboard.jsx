import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [reports, setReports] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/api/admin/reports').then((d) => setReports(d.reports)).catch((e) => setError(e.message))
  }, [])

  const items = reports
    ? [
        { label: 'Students', value: reports.students },
        { label: 'Faculty', value: reports.faculty },
        { label: 'Courses', value: reports.courses },
        { label: 'Attendance Records', value: reports.attendance_records },
        { label: 'Results Entries', value: reports.results_entries },
      ]
    : []

  return (
    <div>
      <div className="page-head">
        <h1>Admin Dashboard</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {!reports && !error && <div className="center-screen"><div className="spinner" /></div>}

      {reports && (
        <>
          <div className="grid grid-4" style={{ marginBottom: 24 }}>
            {items.map((it) => (
              <div className="card stat" key={it.label}>
                <span className="stat-label">{it.label}</span>
                <span className="stat-value">{it.value}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 12 }}>System Overview</h3>
            <p className="muted small">
              Welcome back, {user?.name}. Use the management modules to administer students, faculty,
              courses, and the timetable. Security is enforced by Firebase authentication,
              role-based access control, and encrypted storage.
            </p>
          </div>
        </>
      )}
    </div>
  )
}