import './Dashboard.css';

function Dashboard() {
  const stats = [
    { label: 'Total Pengajuan', value: '5', icon: '📝' },
    { label: 'Disetujui', value: '3', icon: '✅' },
    { label: 'Menunggu', value: '1', icon: '⏳' },
    { label: 'Ditolak', value: '1', icon: '❌' }
  ];

  const recentActivities = [
    { title: 'Pengajuan Seminar Proposal', status: 'Disetujui', date: '15 Nov 2025' },
    { title: 'Pengajuan Seminar Hasil', status: 'Menunggu', date: '14 Nov 2025' },
    { title: 'Upload Revisi', status: 'Selesai', date: '13 Nov 2025' }
  ];

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Selamat datang, Cindy</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="activity-section">
        <h2>Aktivitas Terbaru</h2>
        <div className="activity-list">
          {recentActivities.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-info">
                <h4>{activity.title}</h4>
                <span className={`status-badge ${activity.status.toLowerCase()}`}>
                  {activity.status}
                </span>
              </div>
              <span className="activity-date">{activity.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
