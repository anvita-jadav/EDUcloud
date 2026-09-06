import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import Toast from '../../components/Toast'
import { QRCourseCard } from '../../components/QRCourseCard'

export default function FacultyAttendance() {
  const [dash, setDash] = useState(null)
  const [students, setStudents] = useState([])
  const [error, setError] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selected, setSelected] = useState({})
  const [toast, setToast] = useState('')

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
    const ids = students.map((s) => s.id)
    const res = await api('/api/faculty/attendance/mark', {
      method: 'POST',
      body: { course_id: selectedCourse, date: selectedDate, student_ids: ids },
    })
    setToast(res.message || 'Attendance marked')
    setSelected({})
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
                {(dash?.courses || []).map((c) => (
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
            <button
              className="btn btn-primary"
              onClick={() => {
                const ids = students.filter((s) => selected[s.id]).map((s) => s.id)
                if (!selectedCourse || !selectedDate) {
                  setToast('Select a course and date first')
                  return
                }
                api('/api/faculty/attendance/mark', {
                  method: 'POST',
                  body: { course_id: selectedCourse, date: selectedDate, student_ids: ids },
                }).then((r) => { setToast(r.message); setSelected({}) })
                  .catch((e) => setToast(e.message))
              }}
            >
              Mark Selected Present
            </button>
            <button className="btn btn-outline" onClick={markAll}>
              Mark All Present
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Generate Attendance QR</h3>
          <p className="small muted" style={{ marginBottom: 16 }}>
            Display this QR in class. Students scan it to check in for the selected course.
          </p>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>Course</label>
            <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
              <option value="">Select course…</option>
              {(dash?.courses || []).map((c) => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </select>
          </div>
          {selectedCourse && (
            <QRCourseCard course={dash?.courses.find((c) => c.id === selectedCourse)} />
          )}
        </div>
      </div>

      {toast && <Toast type="success" message={toast} onClose={() => setToast('')} />}
    </div>
  )
}