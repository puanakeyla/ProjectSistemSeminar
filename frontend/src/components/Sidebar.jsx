import React from 'react'
import { GraduationCap, LogOut } from 'lucide-react'

const Sidebar = ({ currentPage, setCurrentPage, sidebarOpen, setSidebarOpen, user, menuItems, onLogout }) => {
  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="brand">
          <div className="brand-icon"><GraduationCap className="w-7 h-7" /></div>
          <div className="brand-text">
            <h3>SEMAR</h3>
            <p>Seminar Management and Registration</p>
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
          {item.icon} {/* LANGSUNG TANPA WRAPPER */}
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-details">
            <p className="user-name">{user?.name || 'User'}</p>
            <p className="user-role">{user?.role || 'Pengguna'}</p>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          <span className="logout-text">Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
