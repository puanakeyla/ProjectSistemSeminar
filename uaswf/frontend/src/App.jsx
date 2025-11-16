import { useState } from 'react'
import Login from './pages/Auth/Login'
import Dashboard from './pages/Mahasiswa/Dashboard'
import Pengajuan from './pages/Mahasiswa/Pengajuan'
import Status from './pages/Mahasiswa/Status'
import Jadwal from './pages/Mahasiswa/Jadwal'
import DaftarHadir from './pages/Mahasiswa/DaftarHadir'
import Revisi from './pages/Mahasiswa/Revisi'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('login')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogin = () => {
    setIsLoggedIn(true)
    setCurrentPage('dashboard')
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentPage('login')
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'pengajuan', label: 'Pengajuan Seminar', icon: '📝' },
    { id: 'status', label: 'Status Pengajuan', icon: '📋' },
    { id: 'jadwal', label: 'Jadwal Seminar', icon: '📅' },
    { id: 'daftarhadir', label: 'Daftar Hadir', icon: '✅' },
    { id: 'revisi', label: 'Revisi & Upload', icon: '📄' }
  ]

  return (
    <div className="app-wrapper">
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div className="app-layout">
          {/* Sidebar */}
          <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-header">
              <div className="brand">
                <div className="brand-icon">🎓</div>
                <div className="brand-text">
                  <h3>UNILA</h3>
                  <p>Sistem Seminar</p>
                </div>
              </div>
            </div>

            <nav className="sidebar-nav">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                  onClick={() => setCurrentPage(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="sidebar-footer">
              <div className="user-info">
                <div className="user-avatar">C</div>
                <div className="user-details">
                  <p className="user-name">Cindy</p>
                  <p className="user-role">Mahasiswa</p>
                </div>
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                <span>🚪</span> Logout
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="main-content">
            {/* Top Bar */}
            <header className="top-bar">
              <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                ☰
              </button>
              <div className="top-bar-right">
                <div className="breadcrumb">
                  <span>Universitas Lampung</span>
                  <span className="separator">/</span>
                  <span className="current">
                    {menuItems.find(item => item.id === currentPage)?.label}
                  </span>
                </div>
              </div>
            </header>

            {/* Content Area */}
            <main className="content-area">
              {currentPage === 'dashboard' && <Dashboard />}
              {currentPage === 'pengajuan' && <Pengajuan />}
              {currentPage === 'status' && <Status />}
              {currentPage === 'jadwal' && <Jadwal />}
              {currentPage === 'daftarhadir' && <DaftarHadir />}
              {currentPage === 'revisi' && <Revisi />}
            </main>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
