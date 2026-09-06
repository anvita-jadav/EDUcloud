import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import Toast from '../../components/Toast'
import { QRScannerView } from '../../components/QRScanner'

export default function StudentAttendance() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [scanner, setScanner] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    api('/api/student/attendance').then(setData).catch((e) => setError(e.message))
  }, [])

  async function handleScan(result) {
    setScanner(false)
    try {
      const courseCode = result?.data || result || ''
      await api('/api/student/attendance/checkin', { method: 'POST', body: { course_code: courseCode } })
      setToast('Attendance marked successfully!')
      const fresh = await api('/api/student/attendance')
      setData(fresh)
    } catch (e) {
      setToast(e.message)
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Attendance</h1>
        <div className="space-x">
          <button className="btn btn-primary" onClick={() => setScanner(!scanner)}>
            {scanner ? 'Close scanner' : 'Scan QR to check in'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {scanner && <QRScannerView onResult={handleScan} />}

      {!data && !error && <div className="center-screen"><div className="spinner" /></div>}

      {data && (
        <>
          <div className="grid grid-3" style={{ marginBottom: 24 }}>
            <div className="card stat">
              <span className="stat-label">Attendance</span>
              <span className="stat-value">{data.percentage || 0}%</span>
            </div>
            <div className="card stat">
              <span className="stat-label">QR Check-ins</span>
              <span className="stat-value">{data.records?.filter((r) => r.method === 'qr').length || 0}</span>
            </div>
            <div className="card stat">
              <span className="stat-label">Manual</span>
              <span className="stat-value">{data.records?.filter((r) => r.method === 'manual').length || 0}</span>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Attendance Records</h3>
            {data.records?.length ? (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Date</th><th>Course</th><th>Status</th><th>Method</th></tr>
                  </thead>
                  <tbody>
                    {data.records.map((r, i) => (
                      <tr key={i}>
                        <td>{r.date}</td>
                        <td>{r.course}</td>
                        <td>
                          <span className={`badge ${r.status === 'present' ? 'badge-present' : 'badge-absent'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td>{r.method === 'qr' ? 'QR' : 'Manual'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty">No attendance records yet — scan a QR to check in.</p>
            )}
          </div>
        </>
      )}

      {toast && <Toast type={toast.includes('marked') ? 'success' : 'error'} message={toast} onClose={() => setToast('')} />}
    </div>
  )
}