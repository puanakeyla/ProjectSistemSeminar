import { useState, useEffect } from 'react'
import Login from './pages/Auth/Login'
// Mahasiswa Components
import Dashboard from './pages/Mahasiswa/Dashboard'
import Pengajuan from './pages/Mahasiswa/Pengajuan'
import Status from './pages/Mahasiswa/Status'
import Jadwal from './pages/Mahasiswa/Jadwal'
import DaftarHadir from './pages/Mahasiswa/DaftarHadir'
import Revisi from './pages/Mahasiswa/Revisi'
// Dosen Components
import NavbarDosen from './pages/Dosen/Navbar'
import DashboardDosen from './pages/Dosen/Dashboard'
import Approval from './pages/Dosen/Approval'
// Admin Components
import NavbarAdmin from './pages/Admin/Navbar'
import DashboardAdmin from './pages/Admin/Dashboard'
import Verification from './pages/Admin/Verification'
import Schedule from './pages/Admin/Schedule'
import QRCodePage from './pages/Admin/QRCode'
import AttendancePage from './pages/Admin/Attendance'
import RevisionPage from './pages/Admin/Revision'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('login')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      const user = JSON.parse(userStr);
      setIsLoggedIn(true);
      setUserRole(user.role);
      setUserData(user);
      setCurrentPage('dashboard'); 
    }
  }, []);

  const handleLogin = (user) => {
    setIsLoggedIn(true)
    setUserRole(user.role)
    setUserData(user)
    setCurrentPage('dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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

  // Render different layout based on role
  const renderMahasiswaLayout = () => (
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
            <div className="user-avatar">
              {userData?.name?.charAt(0).toUpperCase() || 'M'}
            </div>
            <div className="user-details">
              <p className="user-name">{userData?.name || 'Mahasiswa'}</p>
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
  );

  const renderDosenLayout = () => (
    <div className="app-layout-dosen">
      {/* Navbar Horizontal */}
      <NavbarDosen 
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
        user={userData}
      />
      
      {/* Content Area */}
      <main className="content-area">
        {currentPage === 'dashboard' && <DashboardDosen />}
        {currentPage === 'approval' && <Approval />}
        {currentPage === 'jadwal' && <div style={{padding: '32px', background: '#f0f4f8', minHeight: '100vh'}}><h1>Jadwal Seminar - Coming Soon</h1></div>}
        {currentPage === 'mahasiswa' && <div style={{padding: '32px', background: '#f0f4f8', minHeight: '100vh'}}><h1>Mahasiswa Bimbingan - Coming Soon</h1></div>}
      </main>
    </div>
  );

  const renderAdminLayout = () => (
    <div className="app-layout-admin">
      {/* Navbar Horizontal */}
      <NavbarAdmin 
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}
        user={userData}
      />
      
      {/* Content Area */}
      <main className="content-area">
        {currentPage === 'dashboard' && <DashboardAdmin />}
        {currentPage === 'verification' && <Verification />}
        {currentPage === 'schedule' && <Schedule />}
        {currentPage === 'qrcode' && <QRCodePage />}
        {currentPage === 'attendance' && <AttendancePage />}
        {currentPage === 'revision' && <RevisionPage />}
      </main>
    </div>
  );

  return (
    <div className="app-wrapper">
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : userRole === 'admin' ? (
        renderAdminLayout()
      ) : userRole === 'dosen' ? (
        renderDosenLayout()
      ) : (
        renderMahasiswaLayout()
      )}
    </div>
  )
}

export default App
