import { useEffect, useState } from 'react'
import CRUDManager from '../../components/CRUDManager'
import { api } from '../../lib/api'

export default function AdminTimetable() {
  const [courses, setCourses] = useState([])

  useEffect(() => {
    api('/api/admin/courses').then((d) => setCourses(d.courses || [])).catch(() => {})
  }, [])

  return (
    <CRUDManager
      basePath="timetable"
      title="Timetable"
      listKey="timetable"
      fields={[
        {
          name: 'course_id',
          label: 'Course',
          required: true,
          type: 'select',
          options: courses.map((c) => ({ value: c.id, label: `${c.code} — ${c.name}` })),
        },
        { name: 'day', label: 'Day' },
        { name: 'time', label: 'Time' },
        { name: 'room', label: 'Room' },
      ]}
    />
  )
}