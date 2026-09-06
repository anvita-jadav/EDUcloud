import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

export default function AdminReports() {
  const [reports, setReports] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/api/admin/reports').then((d) => setReports(d.reports)).catch((e) => setError(e.message))
  }, [])

  return (
    <div>
      <div className="page-head">
        <h1>Reports</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {!reports && !error && <div className="center-screen"><div className="spinner" /></div>}

      {reports && (
        <>
          <div className="grid grid-4" style={{ marginBottom: 24 }}>
            {Object.entries(reports).map(([k, v]) => (
              <div className="card stat" key={k}>
                <span className="stat-label">{k.replace(/_/g, ' ')}</span>
                <span className="stat-value">{v}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Faculty Performance</h3>
            <FaultyReportsTable />
          </div>
        </>
      )}
    </div>
  )
}

function FaultyReportsTable() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api('/api/faculty/reports')
      .then((d) => setRows(d.reports || []))
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <div className="alert alert-danger">{error}</div>

  return rows.length ? (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr><th>Course</th><th>Code</th><th>Attendance %</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.course}</td>
              <td>{r.code}</td>
              <td>{r.attendance_pct}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <p className="muted small">No report data yet.</p>
  )
}