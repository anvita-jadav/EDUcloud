import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import DashboardLayout from './components/DashboardLayout'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentAttendance from './pages/student/StudentAttendance'
import StudentResults from './pages/student/StudentResults'
import FacultyDashboard from './pages/faculty/FacultyDashboard'
import FacultyAttendance from './pages/faculty/FacultyAttendance'
import FacultyMarks from './pages/faculty/FacultyMarks'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminStudents from './pages/admin/AdminStudents'
import AdminFaculty from './pages/admin/AdminFaculty'
import AdminCourses from './pages/admin/AdminCourses'
import AdminTimetable from './pages/admin/AdminTimetable'
import AdminReports from './pages/admin/AdminReports'

function Protected({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />
  return children
}

function LoadingScreen() {
  return (
    <div className="center-screen">
      <div className="spinner" />
    </div>
  )
}

function RoleHome() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={`/${user.role}`} replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<RoleHome />} />

          <Route path="/student" element={<Protected role="student"><DashboardLayout /></Protected>}>
            <Route index element={<StudentDashboard />} />
            <Route path="attendance" element={<StudentAttendance />} />
            <Route path="results" element={<StudentResults />} />
          </Route>

          <Route path="/faculty" element={<Protected role="faculty"><DashboardLayout /></Protected>}>
            <Route index element={<FacultyDashboard />} />
            <Route path="attendance" element={<FacultyAttendance />} />
            <Route path="marks" element={<FacultyMarks />} />
          </Route>

          <Route path="/admin" element={<Protected role="admin"><DashboardLayout /></Protected>}>
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="faculty" element={<AdminFaculty />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="timetable" element={<AdminTimetable />} />
            <Route path="reports" element={<AdminReports />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
