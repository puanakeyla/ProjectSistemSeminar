import { useState, useEffect } from 'react';
import './Dashboard.css';
import { adminAPI } from '../../services/api';
import { BarChart, Clock, Calendar, CheckCircle } from 'lucide-react';

function Dashboard() {
  const [stats, setStats] = useState({
    totalSeminars: 0,
    pendingVerification: 0,
    scheduledToday: 0,
    totalAttendance: 0,
    verificationRate: 0,
    scheduleRate: 0
  });
  const [recentSeminars, setRecentSeminars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard statistics
      const response = await adminAPI.getDashboard();
      const data = response.data;

      // Set stats from API response
      setStats({
        totalSeminars: data.seminar_statistics?.total || 0,
        pendingVerification: data.seminar_statistics?.pending_verification || 0,
        scheduledToday: data.today_seminars?.length || 0,
        totalAttendance: data.attendance_statistics?.total_attendances || 0,
        verificationRate: 0,
        scheduleRate: 0
      });

      // Set recent seminars
      setRecentSeminars(data.recent_seminars || []);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Dashboard Admin</h1>
          <p>Sistem Manajemen Seminar - Universitas Lampung</p>
        </div>
        <button className="refresh-btn" onClick={fetchDashboardData}>
          <span>🔄</span> Refresh
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon"><BarChart className="w-7 h-7" /></div>
          <div className="stat-content">
            <h3>{stats.totalSeminars}</h3>
            <p>Total Seminar</p>
            <span className="stat-label">Keseluruhan sistem</span>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon"><Clock className="w-7 h-7" /></div>
          <div className="stat-content">
            <h3>{stats.pendingVerification}</h3>
            <p>Menunggu Verifikasi</p>
            <span className="stat-label">Perlu ditindaklanjuti</span>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon"><Calendar className="w-7 h-7" /></div>
          <div className="stat-content">
            <h3>{stats.scheduledToday}</h3>
            <p>Jadwal Hari Ini</p>
            <span className="stat-label">Seminar terjadwal</span>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon"><CheckCircle className="w-7 h-7" /></div>
          <div className="stat-content">
            <h3>{stats.totalAttendance}</h3>
            <p>Total Kehadiran</p>
            <span className="stat-label">Absensi terekam</span>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="stats-secondary">
        <div className="secondary-card">
          <div className="progress-stat">
            <div className="progress-header">
              <span>Tingkat Verifikasi</span>
              <strong>{stats.verificationRate}%</strong>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill verification" 
                style={{ width: `${stats.verificationRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="secondary-card">
          <div className="progress-stat">
            <div className="progress-header">
              <span>Tingkat Penjadwalan</span>
              <strong>{stats.scheduleRate}%</strong>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill schedule" 
                style={{ width: `${stats.scheduleRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Seminars */}
      <div className="recent-seminars">
        <div className="section-header">
          <h2>Seminar Menunggu Verifikasi</h2>
          <span className="count-badge">{recentSeminars.length}</span>
        </div>

        {recentSeminars.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✓</div>
            <h3>Semua Terverifikasi!</h3>
            <p>Tidak ada seminar yang menunggu verifikasi saat ini</p>
          </div>
        ) : (
          <div className="seminars-table">
            <table>
              <thead>
                <tr>
                  <th>Mahasiswa</th>
                  <th>Judul Seminar</th>
                  <th>Tipe</th>
                  <th>Status Approval</th>
                  <th>Tanggal Pengajuan</th>
                </tr>
              </thead>
              <tbody>
                {recentSeminars.map((seminar, index) => (
                  <tr key={seminar.id || index}>
                    <td>
                      <div className="mahasiswa-info">
                        <strong>{seminar.mahasiswa_name || 'N/A'}</strong>
                        <span>{seminar.mahasiswa_npm || '-'}</span>
                      </div>
                    </td>
                    <td className="seminar-title">{seminar.judul}</td>
                    <td>
                      <span className={`type-badge ${seminar.tipe}`}>
                        {seminar.tipe === 'proposal' ? '📋 Proposal' : '📘 Hasil'}
                      </span>
                    </td>
                    <td>
                      <div className="approval-status">
                        <span className={`status-badge ${seminar.approval_count === 3 ? 'complete' : 'pending'}`}>
                          {seminar.approval_count || 0}/3 Disetujui
                        </span>
                      </div>
                    </td>
                    <td>{formatDate(seminar.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
