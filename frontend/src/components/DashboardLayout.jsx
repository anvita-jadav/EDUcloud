import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import Chatbot from './Chatbot'

const NAV = {
  student: [
    { to: '/student', label: 'Dashboard', icon: '🏠', end: true },
    { to: '/student/attendance', label: 'Scan Attendance', icon: '📷' },
    { to: '/student/results', label: 'Results', icon: '🎓' },
  ],
  faculty: [
    { to: '/faculty', label: 'Dashboard', icon: '🏠', end: true },
    { to: '/faculty/attendance', label: 'Attendance & QR', icon: '✅' },
    { to: '/faculty/marks', label: 'Enter Marks', icon: '📊' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: '🏠', end: true },
    { to: '/admin/students', label: 'Students', icon: '🎓' },
    { to: '/admin/faculty', label: 'Faculty', icon: '👩‍🏫' },
    { to: '/admin/courses', label: 'Courses', icon: '📚' },
    { to: '/admin/timetable', label: 'Timetable', icon: '🗓️' },
    { to: '/admin/reports', label: 'Reports', icon: '📈' },
  ],
}

const ROLE_COLORS = {
  student: '#2563eb',
  faculty: '#7c3aed',
  admin: '#0f766e',
}

export default function DashboardLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    const role = user?.role
    if (!role) return
    let cancelled = false
    if (role === 'student') {
      api('/api/student/notifications').then((d) => {
        if (!cancelled) setNotifCount(d.notifications?.length || 0)
      }).catch(() => {})
    } else if (role === 'admin') {
      api('/api/admin/notifications').then((d) => {
        if (!cancelled) setNotifCount(d.notifications?.length || 0)
      }).catch(() => {})
    }
    return () => { cancelled = true }
  }, [user?.user_id, user?.role])

  const items = NAV[user?.role] || []

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="layout">
      <aside className="sidebar" style={{ '--accent': ROLE_COLORS[user?.role] }}>
        <div className="brand">
          <span className="brand-logo">E</span>
          <div>
            <div className="brand-name">EduCloude</div>
            <div className="brand-sub">Connected on One Platform</div>
          </div>
        </div>
        <nav className="side-nav">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span style={{ opacity: 0.8, marginRight: 10 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="btn btn-ghost" onClick={handleSignOut}>Sign out</button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <div className="topbar-title">{user?.name || 'User'}</div>
            <div className="topbar-sub">
              {user?.role ? user.role[0].toUpperCase() + user.role.slice(1) : ''} · EduCloude
              {notifCount > 0 && <span className="notif-badge">{notifCount}</span>}
            </div>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-ghost" onClick={handleSignOut}>Sign out</button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
        <Chatbot />
      </div>
    </div>
  )
}