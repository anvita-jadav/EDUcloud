import CRUDManager from '../../components/CRUDManager'

export default function AdminStudents() {
  return (
    <CRUDManager
      basePath="students"
      title="Students"
      listKey="students"
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'roll_number', label: 'Roll Number' },
        { name: 'department', label: 'Department' },
        { name: 'semester', label: 'Semester' },
      ]}
    />
  )
}