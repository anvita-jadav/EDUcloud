import CRUDManager from '../../components/CRUDManager'

export default function AdminCourses() {
  return (
    <CRUDManager
      basePath="courses"
      title="Courses"
      listKey="courses"
      fields={[
        { name: 'code', label: 'Code', required: true },
        { name: 'name', label: 'Name', required: true },
        { name: 'department', label: 'Department' },
        { name: 'semester', label: 'Semester' },
        { name: 'credits', label: 'Credits', type: 'number' },
      ]}
    />
  )
}