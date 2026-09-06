import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/api/student/dashboard').then(setData).catch((e) => setError(e.message))
  }, [])

  return (
    <div>
      <div className="page-head">
        <h1>Dashboard</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {!data && !error && (
        <div className="center-screen"><div className="spinner" /></div>
      )}

      {data && (
        <>
          <div className="grid grid-4" style={{ marginBottom: 24 }}>
            <div className="card stat">
              <span className="stat-label">Attendance</span>
              <span className="stat-value" style={{ color: data.attendance?.percentage >= 75 ? 'var(--success)' : 'var(--warning)' }}>
                {data.attendance?.percentage || 0}%
              </span>
              <span className="stat-sub">{data.attendance?.present}/{data.attendance?.total} days present</span>
            </div>
            <div className="card stat">
              <span className="stat-label">Subjects</span>
              <span className="stat-value">{data.results?.subjects || 0}</span>
              <span className="stat-sub">courses in progress</span>
            </div>
            <div className="card stat">
              <span className="stat-label">Avg Internal</span>
              <span className="stat-value">{data.results?.avg_internal || 0}</span>
              <span className="stat-sub">marks</span>
            </div>
            <div className="card stat">
              <span className="stat-label">Avg External</span>
              <span className="stat-value">{data.results?.avg_external || 0}</span>
              <span className="stat-sub">marks</span>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>Profile</h3>
              <p><strong>Name:</strong> {data.name || user?.name}</p>
              <p><strong>Roll:</strong> {data.roll_number}</p>
              <p><strong>Department:</strong> {data.department}</p>
              <p><strong>Semester:</strong> {data.semester}</p>
              <p><strong>Faculty:</strong> {data.mentor || 'Not assigned'}</p>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 12 }}>Today's Timetable</h3>
              {data.timetable?.length ? (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr><th>Course</th><th>Day</th><th>Time</th><th>Room</th></tr>
                    </thead>
                    <tbody>
                      {data.timetable.map((t, i) => (
                        <tr key={i}>
                          <td>{t.course}</td>
                          <td>{t.day}</td>
                          <td>{t.time}</td>
                          <td>{t.room}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="muted small">No timetable entries yet.</p>
              )}
            </div>

            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <h3 style={{ marginBottom: 12 }}>Notifications</h3>
              {data.notifications?.length ? (
                <div className="space-y">
                  {data.notifications.map((n, i) => (
                    <div key={i} className="card" style={{ padding: 14, boxShadow: 'none' }}>
                      <div className="space-btw">
                        <strong>{n.title}</strong>
                        <span className="muted small">{new Date(n.date).toLocaleDateString()}</span>
                      </div>
                      <p className="small" style={{ marginTop: 4 }}>{n.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted small">No notifications.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}