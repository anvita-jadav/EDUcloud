import CRUDManager from '../../components/CRUDManager'

export default function AdminTimetable() {
  return (
    <CRUDManager
      basePath="timetable"
      title="Timetable"
      listKey="timetable"
      fields={[
        { name: 'course_id', label: 'Course ID', required: true },
        { name: 'day', label: 'Day' },
        { name: 'time', label: 'Time' },
        { name: 'room', label: 'Room' },
      ]}
    />
  )
}