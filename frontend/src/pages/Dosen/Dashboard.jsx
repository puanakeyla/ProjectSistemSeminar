import { useState, useEffect } from 'react';
import { dosenAPI } from '../../services/api';
import './Dashboard.css';

function Dashboard() {
  const [statistics, setStatistics] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, approvalsRes] = await Promise.all([
        dosenAPI.getStatistics(),
        dosenAPI.getPendingApprovals()
      ]);
      
      setStatistics(statsRes.data);
      setPendingApprovals(approvalsRes.data.slice(0, 3)); // Only take 3 for preview
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-dosen">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
          <h2>Memuat data...</h2>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Menunggu Persetujuan', value: statistics?.pending || '0', icon: '⏳', color: '#F59E0B' },
    { label: 'Seminar Disetujui', value: statistics?.approved || '0', icon: '✅', color: '#10B981' },
    { label: 'Total Persetujuan', value: statistics?.total_approvals || '0', icon: '👥', color: '#3B82F6' },
    { label: 'Tingkat Persetujuan', value: `${statistics?.approval_rate || '0'}%`, icon: '📊', color: '#8B5CF6' }
  ];

  const upcomingSchedules = [
    {
      mahasiswa: 'Dewi Kusuma',
      tipe: 'Proposal',
      waktu: '21 Jan 2025, 09:00',
      ruang: 'Lab A301',
      peran: 'Pembimbing 1'
    },
    {
      mahasiswa: 'Rizky Pratama',
      tipe: 'Hasil',
      waktu: '22 Jan 2025, 13:00',
      ruang: 'Ruang Sidang',
      peran: 'Penguji'
    }
  ];

  const getTipeColor = (tipe) => {
    const colors = {
      'Proposal': '#3B82F6',
      'Hasil': '#F59E0B',
      'Komprehensif': '#8B5CF6'
    };
    return colors[tipe] || '#6B7280';
  };

  return (
    <div className="dashboard-dosen">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Dashboard Dosen</h1>
          <p>Selamat datang di Portal Dosen Pembimbing</p>
        </div>
        <div className="header-date">
          <span className="date-icon">📅</span>
          <span className="date-text">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card" style={{ borderLeftColor: stat.color }}>
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Pending Approvals */}
        <div className="content-section">
          <div className="section-header">
            <h2>
              <span className="header-icon">⏳</span>
              Menunggu Persetujuan
            </h2>
            <span className="badge-count">{pendingApprovals.length}</span>
          </div>
          <div className="approvals-list">
            {pendingApprovals.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                <p>Tidak ada persetujuan menunggu</p>
              </div>
            ) : (
              pendingApprovals.map((approval) => (
                <div key={approval.id} className="approval-card">
                  <div className="approval-header">
                    <div className="student-info">
                      <h4>{approval.mahasiswa_name}</h4>
                      <span className="npm">{approval.mahasiswa_npm}</span>
                    </div>
                    <span className="tipe-badge" style={{ backgroundColor: getTipeColor(approval.tipe) }}>
                      {approval.tipe}
                    </span>
                  </div>
                  <p className="judul">{approval.judul}</p>
                  <div className="approval-footer">
                    <div className="approval-meta">
                      <span className="meta-item">
                        <span className="meta-icon">👤</span>
                        {approval.peran}
                      </span>
                      <span className="meta-item">
                        <span className="meta-icon">📅</span>
                        {approval.created_at}
                      </span>
                    </div>
                    <button className="btn-quick-review">
                      Tinjau
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <button className="btn-view-all">
            Lihat Semua Persetujuan →
          </button>
        </div>

        {/* Upcoming Schedules */}
        <div className="content-section">
          <div className="section-header">
            <h2>
              <span className="header-icon">📅</span>
              Jadwal Mendatang
            </h2>
          </div>
          <div className="schedules-list">
            {upcomingSchedules.map((schedule, index) => (
              <div key={index} className="schedule-card">
                <div className="schedule-time">
                  <span className="time-icon">🕐</span>
                  <div className="time-info">
                    <p className="time">{schedule.waktu.split(', ')[1]}</p>
                    <p className="date">{schedule.waktu.split(', ')[0]}</p>
                  </div>
                </div>
                <div className="schedule-divider"></div>
                <div className="schedule-details">
                  <h4>{schedule.mahasiswa}</h4>
                  <div className="schedule-meta">
                    <span className="meta-tag" style={{ backgroundColor: getTipeColor(schedule.tipe) }}>
                      {schedule.tipe}
                    </span>
                    <span className="meta-text">• {schedule.ruang}</span>
                  </div>
                  <p className="role-badge">{schedule.peran}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="btn-view-all">
            Lihat Semua Jadwal →
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
