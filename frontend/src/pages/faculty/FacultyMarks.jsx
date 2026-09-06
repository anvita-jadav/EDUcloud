import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import Toast from '../../components/Toast'

const GRADES = ['A+', 'A', 'B+', 'B', 'C', 'D', 'F']

export default function FacultyMarks() {
  const [dash, setDash] = useState(null)
  const [students, setStudents] = useState([])
  const [error, setError] = useState('')
  const [courseId, setCourseId] = useState('')
  const [entries, setEntries] = useState({})
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    api('/api/faculty/dashboard').then(setDash).catch((e) => setError(e.message))
    api('/api/faculty/students').then((d) => setStudents(d.students || [])).catch(() => {})
  }, [])

  function setField(sid, field, value) {
    if (field === 'internal' || field === 'external') {
      const num = Number(value)
      if (value !== '' && (isNaN(num) || num < 0 || num > 50)) return
    }
    setEntries((prev) => ({
      ...prev,
      [sid]: { ...(prev[sid] || {}), [field]: value },
    }))
  }

  function computeGrade(internal, external) {
    const total = (Number(internal) || 0) + (Number(external) || 0)
    if (total >= 90) return 'A+'
    if (total >= 80) return 'A'
    if (total >= 70) return 'B+'
    if (total >= 60) return 'B'
    if (total >= 50) return 'C'
    if (total >= 40) return 'D'
    return 'F'
  }

  async function saveAll() {
    if (!courseId) {
      setToast('Select a course first')
      return
    }
    const keys = Object.keys(entries)
    if (!keys.length) {
      setToast('No entries to save')
      return
    }
    setBusy(true)
    const failed = []
    let saved = 0
    for (const sid of keys) {
      const e = entries[sid]
      const internal = Number(e.internal) || 0
      const external = Number(e.external) || 0
      const grade = e.grade && GRADES.includes(e.grade) ? e.grade : computeGrade(internal, external)
      try {
        await api('/api/faculty/results/enter', {
          method: 'POST',
          body: { course_id: courseId, student_id: sid, internal_marks: internal, external_marks: external, grade },
        })
        saved++
      } catch (err) {
        failed.push(`${e.name || sid}: ${err.message}`)
      }
    }
    if (saved && failed.length) setToast(`Saved ${saved} and ${failed.length} failed: ${failed.join(' · ')}`)
    else if (saved) setToast(`Saved results for ${saved} student${saved > 1 ? 's' : ''}`)
    else if (failed.length) setToast(`Nothing saved: ${failed.join(' · ')}`)
    if (failed.length === 0) setEntries({})
    setBusy(false)
  }

  return (
    <div>
      <div className="page-head">
        <h1>Enter Marks</h1>
        <button className="btn btn-primary" onClick={saveAll} disabled={busy}>
          {busy ? 'Saving…' : 'Save all'}
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="form-group" style={{ maxWidth: 400 }}>
          <label>Course</label>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">Select course…</option>
            {(dash?.courses || []).map((c) => (
              <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {courseId && (
        <div className="card">
          <h3 style={{ marginBottom: 12 }}>Marks Entry</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Roll</th>
                  <th>Student</th>
                  <th>Internal (50)</th>
                  <th>External (50)</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const e = entries[s.id] || {}
                  return (
                    <tr key={s.id}>
                      <td>{s.roll_number}</td>
                      <td>{s.name}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={e.internal ?? ''}
                          onChange={(ev) => setField(s.id, 'internal', ev.target.value)}
                          style={{ width: 80 }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={e.external ?? ''}
                          onChange={(ev) => setField(s.id, 'external', ev.target.value)}
                          style={{ width: 80 }}
                        />
                      </td>
                      <td>
                        <select
                          value={e.grade ?? computeGrade(e.internal, e.external)}
                          onChange={(ev) => setField(s.id, 'grade', ev.target.value)}
                          style={{ width: 80 }}
                        >
                          {GRADES.map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toast && <Toast type="success" message={toast} onClose={() => setToast('')} />}
    </div>
  )
}