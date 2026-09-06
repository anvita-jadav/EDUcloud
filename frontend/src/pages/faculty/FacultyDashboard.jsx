import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'

export default function FacultyDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/api/faculty/dashboard').then(setData).catch((e) => setError(e.message))
  }, [])

  return (
    <div>
      <div className="page-head">
        <h1>Dashboard</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {!data && !error && <div className="center-screen"><div className="spinner" /></div>}

      {data && (
        <>
          <div className="grid grid-3" style={{ marginBottom: 24 }}>
            <div className="card stat">
              <span className="stat-label">Courses</span>
              <span className="stat-value">{data.courses?.length || 0}</span>
              <span className="stat-sub">assigned to you</span>
            </div>
            <div className="card stat">
              <span className="stat-label">Attendance Marked</span>
              <span className="stat-value">{data.attendance_marked || 0}</span>
              <span className="stat-sub">{data.attendance_percentage || 0}% present</span>
            </div>
            <div className="card stat">
              <span className="stat-label">Students</span>
              <span className="stat-value">{data.students_total || 0}</span>
              <span className="stat-sub">in institution</span>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>Profile</h3>
              <p><strong>Name:</strong> {data.name || user?.name}</p>
              <p><strong>Department:</strong> {data.department}</p>
              <p><strong>Subject:</strong> {data.subject}</p>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 12 }}>My Courses</h3>
              {data.courses?.length ? (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr><th>Code</th><th>Course</th><th>Semester</th></tr>
                    </thead>
                    <tbody>
                      {data.courses.map((c) => (
                        <tr key={c.id}>
                          <td>{c.code}</td>
                          <td>{c.name}</td>
                          <td>{c.semester}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="muted small">No courses assigned yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}