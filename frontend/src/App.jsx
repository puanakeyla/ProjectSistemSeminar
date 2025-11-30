import { useState, useEffect } from 'react'
import Login from './pages/Auth/Login'
// Mahasiswa Components
import Dashboard from './pages/Mahasiswa/Dashboard'
import Pengajuan from './pages/Mahasiswa/Pengajuan'
import Status from './pages/Mahasiswa/Status'
import Jadwal from './pages/Mahasiswa/Jadwal'
import DaftarHadir from './pages/Mahasiswa/DaftarHadir'
import Revisi from './pages/Mahasiswa/Revisi'
import ScanQR from './pages/Mahasiswa/ScanQR'
// Dosen Components
import DashboardDosen from './pages/Dosen/Dashboard'
import Approval from './pages/Dosen/Approval'
import JadwalDosen from './pages/Dosen/Jadwal'
// Admin Components
import DashboardAdmin from './pages/Admin/Dashboard'
import Verification from './pages/Admin/Verification'
import Schedule from './pages/Admin/Schedule'
import QRCodePage from './pages/Admin/QRCode'
import AttendancePage from './pages/Admin/Attendance'
import RevisionPage from './pages/Admin/Revision'
import './App.css'
import { BarChart3, FileText, ClipboardList, Calendar, CheckCircle, QrCode, FileCheck } from 'lucide-react'
import Sidebar from './components/Sidebar'

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

  useEffect(() => {
    const handleExternalNavigation = (event) => {
      const targetPage = event.detail?.page;
      if (!targetPage) return;

      setCurrentPage(targetPage);
      setSidebarOpen(true);
    };

    window.addEventListener('semar:navigate', handleExternalNavigation);
    return () => window.removeEventListener('semar:navigate', handleExternalNavigation);
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

  const getMenuItems = (role) => {
    if (role === 'admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" /> },
        { id: 'verification', label: 'Verifikasi', icon: <ClipboardList className="w-5 h-5" /> },
        { id: 'schedule', label: 'Jadwal', icon: <Calendar className="w-5 h-5" /> },
        { id: 'qrcode', label: 'QR Code', icon: <QrCode className="w-5 h-5" /> },
        { id: 'attendance', label: 'Absensi', icon: <CheckCircle className="w-5 h-5" /> },
        { id: 'revision', label: 'Revisi', icon: <FileCheck className="w-5 h-5" /> }
      ]
    }

    if (role === 'dosen') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" /> },
        { id: 'approval', label: 'Approval', icon: <ClipboardList className="w-5 h-5" /> },
        { id: 'jadwal', label: 'Jadwal', icon: <Calendar className="w-5 h-5" /> },
        { id: 'mahasiswa', label: 'Mahasiswa', icon: <FileText className="w-5 h-5" /> }
      ]
    }

    // default mahasiswa
    return [
      { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-5 h-5" /> },
      { id: 'pengajuan', label: 'Pengajuan Seminar', icon: <FileText className="w-5 h-5" /> },
      { id: 'status', label: 'Status Pengajuan', icon: <ClipboardList className="w-5 h-5" /> },
      { id: 'jadwal', label: 'Jadwal Seminar', icon: <Calendar className="w-5 h-5" /> },
      { id: 'daftarhadir', label: 'Daftar Hadir', icon: <CheckCircle className="w-5 h-5" /> },
      { id: 'scanqr', label: 'Scan QR Absensi', icon: <QrCode className="w-5 h-5" /> },
      { id: 'revisi', label: 'Revisi & Upload', icon: <FileCheck className="w-5 h-5" /> }
    ]
  }

  const renderLayout = (role) => {
    const items = getMenuItems(role)
    return (
      <div className={`app-layout`}>
        <Sidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          user={userData}
          menuItems={items}
          onLogout={handleLogout}
        />

        <div className="main-content">
          <header className="top-bar">
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              ☰
            </button>
            <div className="top-bar-right">
              <div className="breadcrumb">
                <span>Universitas Lampung</span>
                <span className="separator">/</span>
                <span className="current">
                  {items.find(item => item.id === currentPage)?.label}
                </span>
              </div>
            </div>
          </header>

          <main className={`content-area ${currentPage === 'revisi' ? 'blue-page' : ''}`}>
            {/* Mahasiswa pages */}
            {currentPage === 'dashboard' && role === 'mahasiswa' && <Dashboard />}
            {currentPage === 'pengajuan' && role === 'mahasiswa' && <Pengajuan />}
            {currentPage === 'status' && role === 'mahasiswa' && <Status />}
            {currentPage === 'jadwal' && role === 'mahasiswa' && <Jadwal />}
            {currentPage === 'daftarhadir' && role === 'mahasiswa' && <DaftarHadir />}
            {currentPage === 'scanqr' && role === 'mahasiswa' && <ScanQR />}
            {currentPage === 'revisi' && role === 'mahasiswa' && <Revisi />}

            {/* Dosen pages */}
            {currentPage === 'dashboard' && role === 'dosen' && <DashboardDosen />}
            {currentPage === 'approval' && role === 'dosen' && <Approval />}
            {currentPage === 'jadwal' && role === 'dosen' && <JadwalDosen />}

            {/* Admin pages */}
            {role === 'admin' && currentPage === 'dashboard' && <DashboardAdmin />}
            {role === 'admin' && currentPage === 'verification' && <Verification />}
            {role === 'admin' && currentPage === 'schedule' && <Schedule />}
            {role === 'admin' && currentPage === 'qrcode' && <QRCodePage />}
            {role === 'admin' && currentPage === 'attendance' && <AttendancePage />}
            {role === 'admin' && currentPage === 'revision' && <RevisionPage />}
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="app-wrapper">
      {!isLoggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        renderLayout(userRole || 'mahasiswa')
      )}
    </div>
  )
}

export default App
