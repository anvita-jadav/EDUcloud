import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

export default function StudentResults() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/api/student/results').then(setData).catch((e) => setError(e.message))
  }, [])

  return (
    <div>
      <div className="page-head">
        <h1>Results</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {!data && !error && <div className="center-screen"><div className="spinner" /></div>}

      {data && (
        <div className="card">
          {data.results?.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Code</th>
                    <th>Internal</th>
                    <th>External</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((r, i) => (
                    <tr key={i}>
                      <td>{r.course}</td>
                      <td>{r.code}</td>
                      <td>{r.internal_marks}</td>
                      <td>{r.external_marks}</td>
                      <td>
                        <span className="badge badge-info">{r.grade || '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty">No results published yet.</p>
          )}
        </div>
      )}
    </div>
  )
}