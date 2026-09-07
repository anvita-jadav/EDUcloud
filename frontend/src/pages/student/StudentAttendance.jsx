import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import Toast from '../../components/Toast'
import { QRScannerView } from '../../components/QRScanner'

export default function StudentAttendance() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [scanner, setScanner] = useState(false)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState('success')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api('/api/student/attendance').then(setData).catch((e) => setError(e.message))
  }, [])

  async function handleScan(result) {
    setScanner(false)
    setBusy(true)
    try {
      const res = await api('/api/student/attendance/checkin', {
        method: 'POST',
        body: { course_code: result || '' },
      })
      setToastType('success')
      setToast(res.message || 'Attendance marked successfully!')
      const fresh = await api('/api/student/attendance')
      setData(fresh)
    } catch (e) {
      setToastType('error')
      setToast(e.message || 'Check-in failed')
    } finally {
      setBusy(false)
    }
  }

  const records = data?.records || []
  const present = records.filter((r) => r.status === 'present').length
  const todayCount = records.filter((r) => r.date === new Date().toISOString().slice(0, 10)).length

  function fmtClock(ts) {
    if (!ts) return '—'
    return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function fmtDuration(min) {
    if (!min) return '—'
    const m = Math.floor(min / 60)
    const s = min % 60
    return m ? `${m}h ${s}m` : `${min} min`
  }

  function fmtDateTime(v) {
    if (!v) return '—'
    const d = new Date(v)
    if (isNaN(d.getTime())) return String(v)
    return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
  }

  return (
    <div>
      <div className="page-head">
        <h1>Attendance</h1>
        <div className="space-x">
          <button className="btn btn-primary" onClick={() => setScanner(!scanner)} disabled={busy}>
            {scanner ? 'Close scanner' : 'Scan QR to check in'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="hero-card">
        <div>
          <p className="hero-eyebrow">Scan your faculty&apos;s class QR</p>
          <h2>Mark yourself present in one tap</h2>
          <p className="small muted">
            Open your faculty&apos;s projector QR while the class is running and scan it. Your
            attendance is saved automatically for that course.
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => setScanner(!scanner)} disabled={busy}>
          {busy ? 'Checking in…' : scanner ? 'Close scanner' : 'Scan QR'}
        </button>
      </div>

      {scanner && <QRScannerView onResult={handleScan} />}

      {!data && !error && <div className="center-screen"><div className="spinner" /></div>}

      {data && (
        <>
          <div className="grid grid-3" style={{ marginBottom: 24 }}>
            <div className="card stat">
              <span className="stat-label">Attendance</span>
              <span className="stat-value">{data.percentage || 0}%</span>
              <span className="stat-sub">{present} of {records.length} classes present</span>
            </div>
            <div className="card stat">
              <span className="stat-label">QR Check-ins</span>
              <span className="stat-value">{records.filter((r) => r.method === 'qr').length || 0}</span>
              <span className="stat-sub">scanned this term</span>
            </div>
            <div className="card stat">
              <span className="stat-label">Manual</span>
              <span className="stat-value">{records.filter((r) => r.method === 'manual').length || 0}</span>
              <span className="stat-sub">{todayCount} class(es) today</span>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Attendance Records</h3>
            {records.length ? (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Course</th>
                      <th>Class time</th>
                      <th>Duration</th>
                      <th>Checked in</th>
                      <th>Status</th>
                      <th>Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, i) => (
                      <tr key={i}>
                        <td>{r.date}</td>
                        <td>{r.course}</td>
                        <td>
                          {r.method === 'qr'
                            ? `${fmtClock(r.session_start)} – ${fmtClock(r.session_end)}`
                            : '—'}
                        </td>
                        <td>{r.method === 'qr' ? fmtDuration(r.session_duration) : '—'}</td>
                        <td>{r.method === 'qr' ? fmtDateTime(r.checked_in_at) : '—'}</td>
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

      {toast && <Toast type={toastType} message={toast} onClose={() => setToast('')} />}
    </div>
  )
}