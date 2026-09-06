import CRUDManager from '../../components/CRUDManager'

export default function AdminFaculty() {
  return (
    <CRUDManager
      basePath="faculty"
      title="Faculty"
      listKey="faculty"
      fields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'department', label: 'Department' },
        { name: 'subject', label: 'Subject' },
      ]}
    />
  )
}