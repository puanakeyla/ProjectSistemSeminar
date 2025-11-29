import './Navbar.css';
import { GraduationCap, BarChart3, CheckCircle, Calendar, QrCode, FileText, LogOut } from 'lucide-react'

function Navbar({ currentPage, onNavigate, onLogout, user }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'verification', label: 'Verifikasi Seminar', icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'schedule', label: 'Penjadwalan', icon: <Calendar className="w-4 h-4" /> },
    { id: 'qrcode', label: 'QR Code', icon: <QrCode className="w-4 h-4" /> },
    { id: 'attendance', label: 'Absensi', icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'revision', label: 'Validasi Revisi', icon: <FileText className="w-4 h-4" /> }
  ];

  return (
    <nav className="navbar-admin">
      <div className="navbar-container">
        {/* Brand Section */}
          <div className="navbar-brand">
          <div className="brand-icon"><GraduationCap className="w-6 h-6" /></div>
          <div className="brand-text">
            <h3>SISEMAR</h3>
            <p>Portal Admin</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="navbar-menu">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`navbar-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="navbar-icon">{item.icon}</span>
              <span className="navbar-label">{item.label}</span>
            </button>
          ))}
        </div>

        {/* User Section */}
        <div className="navbar-user">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="user-details">
              <p className="user-name">{user?.name || 'Admin'}</p>
              <p className="user-role">Administrator</p>
            </div>
          </div>
          <button className="logout-btn" onClick={onLogout} title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
