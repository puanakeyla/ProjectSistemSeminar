import { useState, useEffect } from 'react';
import axios from 'axios';
import './Dashboard.css';

const API_URL = 'http://localhost:8000/api';

function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    disetujui: 0,
    menunggu: 0,
    ditolak: 0,
    attended: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.name);
      }

      const response = await axios.get(`${API_URL}/mahasiswa/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = response.data.data;
      setStats({
        total: data.seminar_counts?.total || 0,
        disetujui: data.seminar_counts?.disetujui || 0,
        menunggu: data.seminar_counts?.menunggu || 0,
        ditolak: data.seminar_counts?.ditolak || 0,
        attended: data.attended_seminars_count || 0
      });
      setRecentActivities(data.recent_seminars || []);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <h2>Memuat dashboard...</h2>
        </div>
      </div>
    );
  }

  const statsDisplay = [
    { label: 'Total Pengajuan', value: stats.total, icon: '📝', color: '#3B82F6' },
    { label: 'Disetujui', value: stats.disetujui, icon: '✅', color: '#10b981' },
    { label: 'Menunggu', value: stats.menunggu, icon: '⏳', color: '#f59e0b' },
    { label: 'Ditolak', value: stats.ditolak, icon: '❌', color: '#ef4444' },
    { label: 'Seminar Diikuti', value: stats.attended, icon: '🎓', color: '#8b5cf6' }
  ];

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Selamat datang, {userName}</p>
      </div>

      <div className="stats-grid">
        {statsDisplay.map((stat, index) => (
          <div key={index} className="stat-card" style={{ borderTop: `4px solid ${stat.color}` }}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="activity-section">
        <h2>Seminar Terbaru</h2>
        {recentActivities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>📋</div>
            <p style={{ color: '#64748b' }}>Belum ada pengajuan seminar</p>
          </div>
        ) : (
          <div className="activity-list">
            {recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-info">
                  <h4>{activity.judul}</h4>
                  <span className="type-badge">{activity.jenis_seminar}</span>
                </div>
                <div className="activity-status">
                  <span className={`status-badge`} style={{ background: activity.status_color }}>
                    {activity.status}
                  </span>
                  <span className="activity-date">{activity.created_at}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="quick-actions">
        <h2>Aksi Cepat</h2>
        <div className="actions-grid">
          <button className="action-btn" onClick={() => window.location.href = '/mahasiswa/pengajuan'}>
            <span className="action-icon">📝</span>
            <span>Ajukan Seminar Baru</span>
          </button>
          <button className="action-btn" onClick={() => window.location.href = '/mahasiswa/status'}>
            <span className="action-icon">📋</span>
            <span>Cek Status</span>
          </button>
          <button className="action-btn" onClick={() => window.location.href = '/mahasiswa/scanqr'}>
            <span className="action-icon">📱</span>
            <span>Scan QR Absensi</span>
          </button>
          <button className="action-btn" onClick={() => window.location.href = '/mahasiswa/revisi'}>
            <span className="action-icon">📄</span>
            <span>Upload Revisi</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
