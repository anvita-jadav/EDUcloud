import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import Toast from '../../components/Toast'
import { QRCodeSVG } from 'qrcode.react'

function toLocalInput(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fmtClock(ts) {
  const d = new Date(ts * 1000)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function useNow(interval = 1000) {
  const [now, setNow] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(t)
  }, [interval])
  return now
}

function LiveStatus({ startsAtTs, endsAtTs }) {
  const now = useNow()
  if (now === 0) return <span className="badge badge-info">Checking…</span>
  const startMs = startsAtTs * 1000
  const endMs = endsAtTs * 1000
  if (now < startMs) {
    const left = Math.ceil((startMs - now) / 1000)
    return <span className="badge badge-info">Starts in {fmtClock(startsAtTs)} ({Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')})</span>
  }
  if (now <= endMs) {
    const left = Math.ceil((endMs - now) / 1000)
    const m = Math.floor(left / 60)
    const s = String(left % 60).padStart(2, '0')
    return <span className="badge badge-live">● LIVE — ends in {m}:{s}</span>
  }
  return <span className="badge badge-absent">● Expired</span>
}

export default function FacultyAttendance() {
  const [dash, setDash] = useState(null)
  const [students, setStudents] = useState([])
  const [error, setError] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [qrCourse, setQrCourse] = useState('')
  const [qrStart, setQrStart] = useState(() => toLocalInput(new Date()))
  const [qrDuration, setQrDuration] = useState(60)
  const [qrData, setQrData] = useState(null)
  const [qrBusy, setQrBusy] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [selected, setSelected] = useState({})
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')
  const [logCourse, setLogCourse] = useState('')
  const [logDate, setLogDate] = useState('')
  const [log, setLog] = useState(null)
  const [logBusy, setLogBusy] = useState(false)

  useEffect(() => {
    api('/api/faculty/dashboard').then(setDash).catch((e) => setError(e.message))
    api('/api/faculty/students').then((d) => setStudents(d.students || [])).catch(() => {})
  }, [])

  function toggle(sid) {
    setSelected((prev) => ({ ...prev, [sid]: !prev[sid] }))
  }

  async function markAll() {
    if (!selectedCourse || !selectedDate) {
      setToast('Select a course and date first')
      return
    }
    setBusy(true)
    try {
      const ids = students.map((s) => s.id)
      const res = await api('/api/faculty/attendance/mark', {
        method: 'POST',
        body: { course_id: selectedCourse, date: selectedDate, student_ids: ids },
      })
      setToast(res.message || 'Attendance marked')
      setSelected({})
    } catch (e) {
      setToast(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function markSelected() {
    if (!selectedCourse || !selectedDate) {
      setToast('Select a course and date first')
      return
    }
    const ids = students.filter((s) => selected[s.id]).map((s) => s.id)
    if (!ids.length) {
      setToast('Select at least one student')
      return
    }
    setBusy(true)
    try {
      const res = await api('/api/faculty/attendance/mark', {
        method: 'POST',
        body: { course_id: selectedCourse, date: selectedDate, student_ids: ids },
      })
      setToast(res.message || 'Attendance marked')
      setSelected({})
    } catch (e) {
      setToast(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function generateQr(e) {
    e?.preventDefault()
    if (!qrCourse) {
      setToast('Select a course first')
      return
    }
    setQrBusy(true)
    setQrData(null)
    try {
      const res = await api('/api/faculty/attendance/qr', {
        method: 'POST',
        body: {
          course_id: qrCourse,
          starts_at: qrStart,
          duration_minutes: qrDuration,
        },
      })
      setQrData(res)
      setToast(`QR generated for ${res.name} — valid ${fmtClock(res.starts_at_ts)}–${fmtClock(res.ends_at_ts)}`)
    } catch (err) {
      setToast(err.message || 'Could not generate QR')
    } finally {
      setQrBusy(false)
    }
  }

  const courses = dash?.courses || []

  async function loadQrLog(e) {
    e?.preventDefault()
    if (!logCourse) {
      setToast('Select a course first')
      return
    }
    setLogBusy(true)
    setLog(null)
    try {
      const q = new URLSearchParams()
      if (logDate) q.set('date', logDate)
      const res = await api(`/api/faculty/attendance/qr-present/${logCourse}?${q.toString()}`)
      setLog(res)
      setToast(res.total_present
        ? `${res.total_present} student(s) present for ${res.course?.name}`
        : 'No students were marked present for this class yet.')
    } catch (err) {
      setToast(err.message || 'Could not load attendance')
    } finally {
      setLogBusy(false)
    }
  }

  function fmtDT(v) {
    if (!v) return '—'
    const d = new Date(v)
    return isNaN(d.getTime()) ? String(v) : d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
  }

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

  return (
    <div>
      <div className="page-head">
        <h1>Attendance & QR</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Mark Manual Attendance</h3>
          <div className="form">
            <div className="form-group">
              <label>Course</label>
              <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
                <option value="">Select course…</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
          </div>
          <h4 style={{ margin: '16px 0 8px' }}>Students</h4>
          {students.length ? (
            <div className="table-wrap" style={{ maxHeight: 320, overflowY: 'auto' }}>
              <table className="table">
                <thead>
                  <tr><th></th><th>Roll</th><th>Name</th></tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={!!selected[s.id]}
                          onChange={() => toggle(s.id)}
                        />
                      </td>
                      <td>{s.roll_number}</td>
                      <td>{s.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted small">No students registered.</p>
          )}
          <div className="space-x mt">
            <button className="btn btn-primary" onClick={markSelected} disabled={busy}>
              {busy ? 'Saving…' : 'Mark Selected Present'}
            </button>
            <button className="btn btn-outline" onClick={markAll} disabled={busy}>
              Mark All Present
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 4 }}>Generate Attendance QR</h3>
          <p className="small muted" style={{ marginBottom: 16 }}>
            Set the class time &amp; duration. Students can check in only while the class is running.
          </p>
          <form className="form" onSubmit={generateQr}>
            <div className="form-group">
              <label>Course</label>
              <select value={qrCourse} onChange={(e) => { setQrCourse(e.target.value); setQrData(null) }}>
                <option value="">Select course…</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Class starts</label>
                <input type="datetime-local" value={qrStart} onChange={(e) => { setQrStart(e.target.value); setQrData(null) }} />
              </div>
              <div style={{ width: 16 }} />
              <div className="form-group" style={{ flex: 1 }}>
                <label>Duration (min)</label>
                <select value={qrDuration} onChange={(e) => { setQrDuration(Number(e.target.value)); setQrData(null) }}>
                  {[30, 45, 60, 90, 120, 180].map((d) => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </div>
            </div>
            <button className="btn btn-primary" disabled={qrBusy}>
              {qrBusy ? 'Generating…' : (qrData ? 'Regenerate QR' : 'Generate QR')}
            </button>
          </form>

          {qrData ? (
            <div className="qr-stage">
              <div className="qr-box">
                <QRCodeSVG value={qrData.token} size={200} bgColor="#ffffff" fgColor="#0f172a" />
              </div>
              <p className="qr-title">{qrData.name}</p>
              <p className="small muted">{qrData.code}</p>
              <p className="qr-window">{fmtClock(qrData.starts_at_ts)} – {fmtClock(qrData.ends_at_ts)}</p>
              <LiveStatus startsAtTs={qrData.starts_at_ts} endsAtTs={qrData.ends_at_ts} />
              <p className="small muted qr-note">Students scan this QR from their app to mark themselves present.</p>
            </div>
          ) : (
            <div className="qr-placeholder">
              <span className="qr-placeholder-icon">▦</span>
              <p className="small muted">Display this QR on screen in class.</p>
              <ol className="qr-steps small">
                <li>Pick your course and class time.</li>
                <li>Click <b>Generate QR</b>.</li>
                <li>Show it at the projector — students scan to check in.</li>
              </ol>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 4 }}>Students Present via QR</h3>
        <p className="small muted" style={{ marginBottom: 16 }}>
          See which students scanned your class QR — with their details and the class date &amp; time.
        </p>
        <form className="form-row" onSubmit={loadQrLog} style={{ alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Course</label>
            <select value={logCourse} onChange={(e) => { setLogCourse(e.target.value); setLog(null) }}>
              <option value="">Select course…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Date (optional)</label>
            <input type="date" value={logDate} onChange={(e) => { setLogDate(e.target.value); setLog(null) }} />
          </div>
          <button className="btn btn-primary" disabled={logBusy || !logCourse}>
            {logBusy ? 'Loading…' : 'Show present students'}
          </button>
        </form>

        {log && (
          <>
            {log.total_present ? (
              <>
                <p className="small" style={{ margin: '16px 0 8px' }}>
                  <strong>{log.total_present}</strong> student{log.total_present === 1 ? '' : 's'} present
                  {logDate ? ` on ${logDate}` : ' (all dates)'} for <strong>{log.course?.name}</strong>
                </p>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Roll</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Sem</th>
                        <th>Date</th>
                        <th>Class time</th>
                        <th>Duration</th>
                        <th>Checked in</th>
                        <th>Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {log.students.map((s, i) => (
                        <tr key={i}>
                          <td>{s.roll_number || '—'}</td>
                          <td><strong>{s.name || '—'}</strong></td>
                          <td>{s.email || '—'}</td>
                          <td>{s.department || '—'}</td>
                          <td>{s.semester || '—'}</td>
                          <td>{s.date || '—'}</td>
                          <td>
                            {s.method === 'qr'
                              ? `${fmtClock(s.session_start)} – ${fmtClock(s.session_end)}`
                              : '—'}
                          </td>
                          <td>{s.method === 'qr' ? fmtDuration(s.session_duration) : '—'}</td>
                          <td>{s.method === 'qr' ? fmtDT(s.checked_in_at) : '—'}</td>
                          <td>{s.method === 'qr' ? 'QR' : 'Manual'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="empty" style={{ marginTop: 16 }}>
                No students present.{' '}
                {logDate ? 'Try a different date or clear it to see all records.' : 'Set up a QR class and wait for students to scan it.'}
              </p>
            )}
          </>
        )}
      </div>

      {toast && <Toast type="success" message={toast} onClose={() => setToast('')} />}
    </div>
  )
}